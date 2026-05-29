import 'package:flutter/material.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Rice', '100 kg'),
      ('Dal', '45 kg'),
      ('Egg', '240 units'),
      ('Spinach', '18 kg'),
      ('Milk', '120 packets'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Inventory')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFFE2E8F0))),
            title: Text(item.$1),
            subtitle: Text('Available stock'),
            trailing: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.bold)),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemCount: items.length,
      ),
    );
  }
}
