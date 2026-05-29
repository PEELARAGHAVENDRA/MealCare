import 'package:flutter/material.dart';
import '../models/meal_entry.dart';
import '../services/offline_sync_service.dart';

class MealEntryScreen extends StatefulWidget {
  const MealEntryScreen({super.key});

  @override
  State<MealEntryScreen> createState() => _MealEntryScreenState();
}

class _MealEntryScreenState extends State<MealEntryScreen> {
  final formKey = GlobalKey<FormState>();
  final menuController = TextEditingController(text: 'Rice, Sambar, Banana');
  final preparedController = TextEditingController(text: '230');
  final servedController = TextEditingController(text: '218');
  final remainingController = TextEditingController(text: '12');
  final notesController = TextEditingController();
  final syncService = OfflineSyncService();

  @override
  void dispose() {
    menuController.dispose();
    preparedController.dispose();
    servedController.dispose();
    remainingController.dispose();
    notesController.dispose();
    super.dispose();
  }

  Future<void> saveOffline() async {
    if (!formKey.currentState!.validate()) return;
    final remaining = double.parse(remainingController.text);
    final entry = MealEntry(
      date: DateTime.now(),
      schoolId: 'demo-school',
      mealType: 'LUNCH',
      menuItems: menuController.text.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList(),
      quantityUsed: double.parse(preparedController.text),
      preparedCount: int.parse(preparedController.text),
      servedCount: int.parse(servedController.text),
      remainingAmount: remaining,
      wastageAmount: remaining,
      notes: notesController.text,
    );

    await syncService.enqueue(endpoint: '/meals', method: 'POST', payload: entry.toJson());
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved offline. It will sync when internet returns.')));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meal Entry')),
      body: Form(
        key: formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(controller: menuController, decoration: const InputDecoration(labelText: 'Menu items'), validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: preparedController, decoration: const InputDecoration(labelText: 'Number prepared'), keyboardType: TextInputType.number, validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: servedController, decoration: const InputDecoration(labelText: 'Number served'), keyboardType: TextInputType.number, validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: remainingController, decoration: const InputDecoration(labelText: 'Remaining / wastage amount'), keyboardType: TextInputType.number, validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: notesController, decoration: const InputDecoration(labelText: 'Food quality notes'), maxLines: 3),
            const SizedBox(height: 20),
            FilledButton.icon(onPressed: saveOffline, icon: const Icon(Icons.save), label: const Text('Save meal entry')),
          ],
        ),
      ),
    );
  }

  String? _required(String? value) => value == null || value.isEmpty ? 'Required' : null;
}
