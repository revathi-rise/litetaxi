import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/api_client.dart';
import 'core/theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/rides_screen.dart';
import 'screens/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  await ApiClient().init();
  runApp(const SwiftCabApp());
}

class SwiftCabApp extends StatelessWidget {
  const SwiftCabApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LiteSpark Taxi',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const _RootNavigator(),
    );
  }
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

enum _AppState { splash, login, home }

class _RootNavigator extends StatefulWidget {
  const _RootNavigator();

  @override
  State<_RootNavigator> createState() => _RootNavigatorState();
}

class _RootNavigatorState extends State<_RootNavigator> {
  _AppState _appState = _AppState.splash;

  @override
  void initState() {
    super.initState();
  }

  void _onSplashDone() {
    setState(() {
      _appState = ApiClient().isLoggedIn ? _AppState.home : _AppState.login;
    });
  }

  void _onLoggedIn() => setState(() => _appState = _AppState.home);
  void _onLogout() => setState(() => _appState = _AppState.login);

  @override
  Widget build(BuildContext context) {
    switch (_appState) {
      case _AppState.splash:
        return SplashScreen(onDone: _onSplashDone);
      case _AppState.login:
        return LoginScreen(onLoggedIn: _onLoggedIn);
      case _AppState.home:
        return _MainShell(onLogout: _onLogout);
    }
  }
}

// ─── Main Shell with Bottom Nav ───────────────────────────────────────────────

class _MainShell extends StatefulWidget {
  final VoidCallback onLogout;
  const _MainShell({required this.onLogout});

  @override
  State<_MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<_MainShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _tab,
        children: [
          const HomeScreen(),
          const RidesScreen(),
          ProfileScreen(onLogout: widget.onLogout),
        ],
      ),
      bottomNavigationBar: _BottomNav(
        current: _tab,
        onChanged: (i) => setState(() => _tab = i),
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int current;
  final ValueChanged<int> onChanged;

  const _BottomNav({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: BottomNavigationBar(
        currentIndex: current,
        onTap: onChanged,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Book',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_outlined),
            activeIcon: Icon(Icons.history),
            label: 'My Rides',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
