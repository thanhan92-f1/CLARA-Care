import 'package:flutter/material.dart';

import 'app.dart';
import 'core/api_client.dart';
import 'core/session_store.dart';

const _defaultApiBaseUrl = String.fromEnvironment(
  'CLARA_API_BASE_URL',
  defaultValue: 'http://localhost:8000',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final sessionStore = SessionStore();
  final apiClient = ApiClient(baseUrl: _defaultApiBaseUrl);

  runApp(
    ClaraApp(
      apiClient: apiClient,
      sessionStore: sessionStore,
    ),
  );
}
