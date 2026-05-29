import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class OfflineSyncService {
  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    final dbPath = await getDatabasesPath();
    _database = await openDatabase(
      join(dbPath, 'midday_meal.db'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE sync_queue(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL
          )
        ''');
      },
    );
    return _database!;
  }

  Future<void> enqueue({
    required String endpoint,
    required String method,
    required Map<String, dynamic> payload,
  }) async {
    final db = await database;
    await db.insert('sync_queue', {
      'endpoint': endpoint,
      'method': method,
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().toIso8601String(),
      'status': 'PENDING',
    });
  }

  Future<int> pendingCount() async {
    final db = await database;
    final result = await db.rawQuery("SELECT COUNT(*) AS count FROM sync_queue WHERE status = 'PENDING'");
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> syncPending({required String apiBaseUrl, required String token}) async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      return 0;
    }

    final db = await database;
    final rows = await db.query('sync_queue', where: "status = 'PENDING'", orderBy: 'created_at ASC');
    var synced = 0;

    for (final row in rows) {
      final endpoint = row['endpoint'] as String;
      final method = row['method'] as String;
      final payload = row['payload'] as String;
      final uri = Uri.parse('$apiBaseUrl$endpoint');
      final headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer $token',
      };

      final response = method == 'POST'
          ? await http.post(uri, headers: headers, body: payload)
          : await http.put(uri, headers: headers, body: payload);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        await db.update('sync_queue', {'status': 'SYNCED'}, where: 'id = ?', whereArgs: [row['id']]);
        synced++;
      }
    }

    return synced;
  }
}
