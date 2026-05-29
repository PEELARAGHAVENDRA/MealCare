import 'package:flutter/material.dart';
import '../services/offline_sync_service.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final presentController = TextEditingController(text: '225');
  final participantsController = TextEditingController(text: '218');
  final syncService = OfflineSyncService();

  @override
  void dispose() {
    presentController.dispose();
    participantsController.dispose();
    super.dispose();
  }

  Future<void> save() async {
    final present = int.parse(presentController.text);
    final participants = int.parse(participantsController.text);
    await syncService.enqueue(
      endpoint: '/attendance',
      method: 'POST',
      payload: {
        'schoolId': 'demo-school',
        'date': DateTime.now().toIso8601String(),
        'presentStudents': present,
        'mealParticipants': participants,
        'absentees': 240 - present,
      },
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Attendance saved offline.')));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: presentController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Present students')),
          const SizedBox(height: 12),
          TextField(controller: participantsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Meal participants')),
          const SizedBox(height: 20),
          FilledButton.icon(onPressed: save, icon: const Icon(Icons.how_to_reg), label: const Text('Save attendance')),
        ],
      ),
    );
  }
}
