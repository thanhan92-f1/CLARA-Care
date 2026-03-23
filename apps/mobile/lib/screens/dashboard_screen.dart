import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/session_store.dart';
import 'careguard_screen.dart';
import 'council_screen.dart';
import 'research_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.apiClient,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final SessionStore sessionStore;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loadingSummary = false;
  String? _summaryError;
  Map<String, dynamic>? _summary;

  bool _loadingMetrics = false;
  String? _metricsError;
  Map<String, dynamic>? _metrics;

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  bool _featureEnabled(String key) {
    final summary = _summary;
    if (summary == null) {
      return false;
    }

    final flags = summary['feature_flags'];
    if (flags is! Map<String, dynamic>) {
      return false;
    }
    return flags[key] == true;
  }

  Future<void> _loadSummary() async {
    final token = widget.sessionStore.accessToken;
    if (token == null || token.isEmpty) {
      return;
    }

    setState(() {
      _loadingSummary = true;
      _summaryError = null;
    });

    try {
      final data = await widget.apiClient.getMobileSummary(accessToken: token);
      if (!mounted) {
        return;
      }

      setState(() {
        _summary = data;
      });

      if (_featureEnabled('system_monitor')) {
        await _loadMetrics();
      } else if (mounted) {
        setState(() {
          _metrics = null;
          _metricsError = null;
        });
      }
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _summaryError = error.toString();
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _summaryError = 'Unexpected error while loading mobile summary.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingSummary = false;
        });
      }
    }
  }

  Future<void> _loadMetrics() async {
    final token = widget.sessionStore.accessToken;
    if (token == null || token.isEmpty) {
      return;
    }

    setState(() {
      _loadingMetrics = true;
      _metricsError = null;
    });

    try {
      final data = await widget.apiClient.getSystemMetrics(accessToken: token);
      if (!mounted) {
        return;
      }
      setState(() {
        _metrics = data;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _metricsError = error.toString();
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _metricsError = 'Unexpected error while loading system metrics.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingMetrics = false;
        });
      }
    }
  }

  Future<void> _openScreen(Widget screen) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => screen),
    );
  }

  String _prettyJson(Map<String, dynamic> json) {
    return const JsonEncoder.withIndent('  ').convert(json);
  }

  @override
  Widget build(BuildContext context) {
    final role = widget.sessionStore.role ?? 'normal';
    final canResearch = _featureEnabled('research');
    final canCareguard = _featureEnabled('careguard');
    final canCouncil = _featureEnabled('council');
    final canSystemMonitor = _featureEnabled('system_monitor');

    return Scaffold(
      appBar: AppBar(
        title: const Text('CLARA Dashboard'),
        actions: [
          IconButton(
            onPressed: widget.sessionStore.clear,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Signed in as ${widget.sessionStore.email ?? '-'}'),
                  const SizedBox(height: 8),
                  Text('Role: $role'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: canResearch
                ? () {
              _openScreen(
                ResearchScreen(
                  apiClient: widget.apiClient,
                  sessionStore: widget.sessionStore,
                ),
              );
            }
                : null,
            child: const Text('Research Tier 2'),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: canCareguard
                ? () {
              _openScreen(
                CareguardScreen(
                  apiClient: widget.apiClient,
                  sessionStore: widget.sessionStore,
                ),
              );
            }
                : null,
            child: const Text('CareGuard Analyze'),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: canCouncil
                ? () {
              _openScreen(
                CouncilScreen(
                  apiClient: widget.apiClient,
                  sessionStore: widget.sessionStore,
                ),
              );
            }
                : null,
            child: const Text('Council Run'),
          ),
          const SizedBox(height: 12),
          if (_loadingSummary)
            const LinearProgressIndicator()
          else if (_summaryError != null)
            Text(
              _summaryError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            )
          else if (_summary != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: SelectableText(_prettyJson(_summary!)),
              ),
            ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'System Metrics',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
              OutlinedButton(
                onPressed: _loadingSummary || _loadingMetrics ? null : _loadSummary,
                child: const Text('Refresh'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (!canSystemMonitor)
            const Text('Role này không có quyền xem system metrics.')
          else if (_loadingMetrics)
            const Center(child: CircularProgressIndicator())
          else if (_metricsError != null)
            Text(
              _metricsError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            )
          else if (_metrics != null)
            SelectableText(_prettyJson(_metrics!))
          else
            const Text('No metrics loaded yet.'),
        ],
      ),
    );
  }
}
