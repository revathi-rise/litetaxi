import 'package:flutter_test/flutter_test.dart';
import 'package:swiftcab_customer/main.dart';

void main() {
  testWidgets('SwiftCab app loads splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const SwiftCabApp());
    // Splash screen should show SwiftCab branding
    expect(find.text('SwiftCab'), findsWidgets);
  });
}
