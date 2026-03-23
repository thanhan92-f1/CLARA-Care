import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/session_store.dart';

class CouncilScreen extends StatefulWidget {
  const CouncilScreen({
    super.key,
    required this.apiClient,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final SessionStore sessionStore;

  @override
  State<CouncilScreen> createState() => _CouncilScreenState();
}

class _CouncilScreenState extends State<CouncilScreen> {
  final _caseController = TextEditingController();

  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _caseController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final caseText = _caseController.text.trim();
    final token = widget.sessionStore.accessToken;

    if (caseText.isEmpty) {
      setState(() {
        _error = 'Please enter case details for council review.';
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
      final response = await widget.apiClient.runCouncil(
        accessToken: token,
        payload: {'case': caseText},
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
        _error = 'Unexpected error while calling council run.';
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
      appBar: AppBar(title: const Text('Council Run')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _caseController,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'Case Summary',
              border: OutlineInputBorder(),
              hintText: 'Enter patient case and ask for council recommendations...',
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
                : const Text('Run /api/v1/council/run'),
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
