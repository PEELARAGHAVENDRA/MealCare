import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

String get apiBaseUrl {
  if (kIsWeb) {
    return 'http://localhost:4000';
  }
  try {
    if (Platform.isAndroid) {
      // Android emulator maps 10.0.2.2 to host's localhost
      return 'http://10.0.2.2:4000';
    }
  } catch (_) {
    // Platform checking is only supported on certain environments
  }
  return 'http://localhost:4000';
}
