import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/session_store.dart';

class CareguardScreen extends StatefulWidget {
  const CareguardScreen({
    super.key,
    required this.apiClient,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final SessionStore sessionStore;

  @override
  State<CareguardScreen> createState() => _CareguardScreenState();
}

class _CareguardScreenState extends State<CareguardScreen> {
  final _symptomsController = TextEditingController();

  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _symptomsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final symptoms = _symptomsController.text.trim();
    final token = widget.sessionStore.accessToken;

    if (symptoms.isEmpty) {
      setState(() {
        _error = 'Please enter symptoms or medication details.';
      });
      return;
    }

    if (token == null || token.isEmpty) {
      setState(() {
        _error = 'Missing access token. Please log in again.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final response = await widget.apiClient.analyzeCareguard(
        accessToken: token,
        payload: {'symptoms': symptoms},
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _result = response;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Unexpected error while calling careguard analyze.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _prettyJson(Map<String, dynamic> json) {
    return const JsonEncoder.withIndent('  ').convert(json);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CareGuard Analyze')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _symptomsController,
            minLines: 3,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Symptoms / Case Input',
              border: OutlineInputBorder(),
              hintText: 'Enter patient symptoms or medication case...',
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _isLoading ? null : _submit,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Run /api/v1/careguard/analyze'),
          ),
          const SizedBox(height: 12),
          if (_error != null)
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          if (_result != null) SelectableText(_prettyJson(_result!)),
        ],
      ),
    );
  }
}
