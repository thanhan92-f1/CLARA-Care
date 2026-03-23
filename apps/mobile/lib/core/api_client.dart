import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException({required this.message, this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() {
    if (statusCode == null) {
      return message;
    }
    return 'HTTP $statusCode: $message';
  }
}

class LoginResponseData {
  const LoginResponseData({
    required this.accessToken,
    required this.refreshToken,
    required this.role,
    required this.tokenType,
  });

  final String accessToken;
  final String refreshToken;
  final String role;
  final String tokenType;

  factory LoginResponseData.fromJson(Map<String, dynamic> json) {
    return LoginResponseData(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      role: (json['role'] as String?) ?? 'normal',
      tokenType: (json['token_type'] as String?) ?? 'bearer',
    );
  }
}

class ApiClient {
  ApiClient({
    required String baseUrl,
    http.Client? httpClient,
  })  : _baseUrl = _trimTrailingSlash(baseUrl),
        _httpClient = httpClient ?? http.Client();

  final String _baseUrl;
  final http.Client _httpClient;

  Future<LoginResponseData> login({
    required String email,
    required String password,
  }) async {
    final data = await _post(
      '/api/v1/auth/login',
      body: {
        'email': email,
        'password': password,
      },
    );

    return LoginResponseData.fromJson(data);
  }

  Future<Map<String, dynamic>> researchTier2({
    required String accessToken,
    required Map<String, dynamic> payload,
  }) {
    return _post(
      '/api/v1/research/tier2',
      body: payload,
      accessToken: accessToken,
    );
  }

  Future<Map<String, dynamic>> analyzeCareguard({
    required String accessToken,
    required Map<String, dynamic> payload,
  }) {
    return _post(
      '/api/v1/careguard/analyze',
      body: payload,
      accessToken: accessToken,
    );
  }

  Future<Map<String, dynamic>> runCouncil({
    required String accessToken,
    required Map<String, dynamic> payload,
  }) {
    return _post(
      '/api/v1/council/run',
      body: payload,
      accessToken: accessToken,
    );
  }

  Future<Map<String, dynamic>> getSystemMetrics({
    required String accessToken,
  }) {
    return _get(
      '/api/v1/system/metrics',
      accessToken: accessToken,
    );
  }

  Future<Map<String, dynamic>> getMobileSummary({
    required String accessToken,
  }) {
    return _get(
      '/api/v1/mobile/summary',
      accessToken: accessToken,
    );
  }

  Future<Map<String, dynamic>> _post(
    String path, {
    required Map<String, dynamic> body,
    String? accessToken,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$_baseUrl$path'),
      headers: _headers(accessToken: accessToken),
      body: jsonEncode(body),
    );

    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> _get(
    String path, {
    String? accessToken,
  }) async {
    final response = await _httpClient.get(
      Uri.parse('$_baseUrl$path'),
      headers: _headers(accessToken: accessToken),
    );

    return _decodeResponse(response);
  }

  Map<String, String> _headers({String? accessToken}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (accessToken != null && accessToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    return headers;
  }

  Map<String, dynamic> _decodeResponse(http.Response response) {
    Map<String, dynamic> payload = <String, dynamic>{};

    if (response.body.isNotEmpty) {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        payload = decoded;
      } else {
        payload = <String, dynamic>{'data': decoded};
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final detail = payload['detail']?.toString();
      throw ApiException(
        statusCode: response.statusCode,
        message: detail ?? 'Request failed',
      );
    }

    return payload;
  }

  static String _trimTrailingSlash(String value) {
    if (value.endsWith('/')) {
      return value.substring(0, value.length - 1);
    }
    return value;
  }
}
