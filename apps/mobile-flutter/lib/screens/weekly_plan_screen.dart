import 'package:flutter/material.dart';

class WeeklyPlanScreen extends StatelessWidget {
  const WeeklyPlanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final plan = [
      ('Monday', 'Rice + Dal + Banana', '82', 'Rs 17'),
      ('Tuesday', 'Rice + Egg Curry', '86', 'Rs 21'),
      ('Wednesday', 'Vegetable Pulao + Milk', '84', 'Rs 22'),
      ('Thursday', 'Spinach Dal + Rice', '91', 'Rs 16'),
      ('Friday', 'Rice + Sambar + Fruit', '88', 'Rs 18'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Weekly Plan Preview')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemBuilder: (context, index) {
          final day = plan[index];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(day.$1, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(day.$2),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Chip(label: Text('Score ${day.$3}')),
                      const SizedBox(width: 8),
                      Chip(label: Text(day.$4)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemCount: plan.length,
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton.icon(
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plan marked ready for approval.'))),
          icon: const Icon(Icons.check),
          label: const Text('Mark ready for approval'),
        ),
      ),
    );
  }
}
