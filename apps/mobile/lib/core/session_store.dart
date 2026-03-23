import 'package:flutter/foundation.dart';

class SessionStore extends ChangeNotifier {
  String? _email;
  String? _accessToken;
  String? _refreshToken;
  String? _role;

  String? get email => _email;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  String? get role => _role;

  bool get isAuthenticated =>
      _accessToken != null && _accessToken!.isNotEmpty;

  void setSession({
    required String email,
    required String accessToken,
    required String refreshToken,
    required String role,
  }) {
    _email = email;
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _role = role;
    notifyListeners();
  }

  void clear() {
    _email = null;
    _accessToken = null;
    _refreshToken = null;
    _role = null;
    notifyListeners();
  }
}
