import 'package:flutter/material.dart';
import 'core/driver_api_client.dart';
import 'core/theme.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/pending_approval_screen.dart';
import 'screens/registration_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = DriverApiClient();
  await api.init();

  Widget initialScreen = const DriverLoginScreen();
  if (api.isAuthenticated) {
    try {
      final res = await api.getDriverProfile();
      if (res['hasProfile'] == true) {
        final profile = res['profile'] as Map<String, dynamic>;
        if (profile['approval'] == 'approved') {
          initialScreen = const DriverDashboardScreen();
        } else {
          initialScreen = DriverPendingApprovalScreen(initialProfile: profile);
        }
      } else {
        initialScreen = const DriverRegistrationScreen();
      }
    } catch (_) {
      initialScreen = const DriverLoginScreen();
    }
  }

  runApp(LiteSparkDriverApp(initialScreen: initialScreen));
}

class LiteSparkDriverApp extends StatelessWidget {
  final Widget initialScreen;
  const LiteSparkDriverApp({super.key, required this.initialScreen});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LiteSpark Driver Partner',
      theme: DriverTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: initialScreen,
    );
  }
}
