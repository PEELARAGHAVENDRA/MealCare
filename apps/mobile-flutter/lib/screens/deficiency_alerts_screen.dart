import 'package:flutter/material.dart';

class DeficiencyAlertsScreen extends StatelessWidget {
  const DeficiencyAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final alerts = [
      ('Protein', 'Medium', 'Add egg, dal, milk, or groundnuts this week.'),
      ('Iron', 'Low', 'Add spinach, beans, or dal to improve iron intake.'),
      ('Vitamin A', 'Low', 'Add carrot or spinach in two meals.'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Deficiency Alerts')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemBuilder: (context, index) {
          final alert = alerts[index];
          return Card(
            child: ListTile(
              leading: const Icon(Icons.warning_amber, color: Color(0xFFF08C21)),
              title: Text('${alert.$1} deficiency'),
              subtitle: Text(alert.$3),
              trailing: Text(alert.$2, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemCount: alerts.length,
      ),
    );
  }
}
