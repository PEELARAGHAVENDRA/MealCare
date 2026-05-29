import 'package:flutter/material.dart';
import '../services/offline_sync_service.dart';

class SyncStatusScreen extends StatefulWidget {
  const SyncStatusScreen({super.key});

  @override
  State<SyncStatusScreen> createState() => _SyncStatusScreenState();
}

class _SyncStatusScreenState extends State<SyncStatusScreen> {
  final syncService = OfflineSyncService();
  int pending = 0;

  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    final count = await syncService.pendingCount();
    if (!mounted) return;
    setState(() => pending = count);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sync Status')),
      body: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_sync, size: 48, color: Color(0xFF17643B)),
                const SizedBox(height: 12),
                Text('$pending pending records', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                const Text('Records are queued locally and ready for background sync.'),
                const SizedBox(height: 16),
                OutlinedButton(onPressed: refresh, child: const Text('Refresh')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
