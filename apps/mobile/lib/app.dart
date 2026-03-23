import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'core/session_store.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';

class ClaraApp extends StatelessWidget {
  const ClaraApp({
    super.key,
    required this.apiClient,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final SessionStore sessionStore;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CLARA Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: AnimatedBuilder(
        animation: sessionStore,
        builder: (context, _) {
          if (sessionStore.isAuthenticated) {
            return DashboardScreen(
              apiClient: apiClient,
              sessionStore: sessionStore,
            );
          }
          return LoginScreen(
            apiClient: apiClient,
            sessionStore: sessionStore,
          );
        },
      ),
    );
  }
}
