import 'package:flutter/material.dart';
import '../core/brand_assets.dart';
import '../core/driver_api_client.dart';
import '../core/theme.dart';
import 'pending_approval_screen.dart';

class DriverRegistrationScreen extends StatefulWidget {
  final String? initialPhone;
  const DriverRegistrationScreen({super.key, this.initialPhone});

  @override
  State<DriverRegistrationScreen> createState() => _DriverRegistrationScreenState();
}

class _DriverRegistrationScreenState extends State<DriverRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = DriverApiClient();

  // Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _aadhaarController = TextEditingController();
  final _licenseController = TextEditingController();
  final _regNumberController = TextEditingController();
  final _modelController = TextEditingController();
  final _colorController = TextEditingController(text: 'White');

  String _selectedCategory = 'sedan';
  List<dynamic> _categories = [];
  String _selectedPlan = 'daily_sub_29';

  // Image URLs or base64 samples
  String? _aadhaarImage;
  String? _licenseImage;
  String? _vehicleFrontImage;
  String? _vehicleBackImage;
  String? _vehicleLeftImage;
  String? _vehicleRightImage;

  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _phoneController.text = widget.initialPhone ?? _api.driverUser?['phone'] ?? '+919000000020';
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final cats = await _api.getVehicleCategories();
    if (mounted) {
      setState(() {
        _categories = cats;
        if (cats.isNotEmpty) {
          _selectedCategory = cats.first['id'] ?? cats.first['code'] ?? 'sedan';
        }
      });
    }
  }

  void _autoFillDemoDocuments() {
    setState(() {
      _nameController.text = 'Murugan S.';
      _emailController.text = 'murugan.driver@litespark.in';
      _aadhaarController.text = '5482 9102 3847';
      _licenseController.text = 'TN-38-2022-0091823';
      _regNumberController.text = 'TN 38 LS 9922';
      _modelController.text = 'Maruti Dzire 2024';
      _colorController.text = 'Pearl White';

      // SVG/PNG data URI samples for documents & vehicle sides
      _aadhaarImage = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600';
      _licenseImage = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600';
      _vehicleFrontImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600';
      _vehicleBackImage = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600';
      _vehicleLeftImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600';
      _vehicleRightImage = 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600';
    });
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;
    if (_aadhaarImage == null || _licenseImage == null) {
      setState(() => _error = 'Please provide photos for Aadhaar Card and Driving Licence (tap "Quick-Fill Demo" or upload)');
      return;
    }
    if (_vehicleFrontImage == null || _vehicleBackImage == null || _vehicleLeftImage == null || _vehicleRightImage == null) {
      setState(() => _error = 'Please upload all 4 sides of the vehicle (Front, Back, Left, Right)');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final payload = {
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'aadhaarNumber': _aadhaarController.text.trim(),
        'aadhaarImageUrl': _aadhaarImage,
        'licenseNumber': _licenseController.text.trim(),
        'licenseImageUrl': _licenseImage,
        'categoryId': _selectedCategory,
        'registrationNumber': _regNumberController.text.trim().toUpperCase(),
        'model': _modelController.text.trim(),
        'color': _colorController.text.trim(),
        'vehicleFrontImageUrl': _vehicleFrontImage,
        'vehicleBackImageUrl': _vehicleBackImage,
        'vehicleLeftImageUrl': _vehicleLeftImage,
        'vehicleRightImageUrl': _vehicleRightImage,
        'pricingPlan': _selectedPlan,
      };

      final res = await _api.registerDriver(payload);
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DriverPendingApprovalScreen(initialProfile: res['profile']),
        ),
      );
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Driver Partner Registration'),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.flash_on, size: 16, color: DriverColors.accent),
            label: const Text('Quick-Fill Demo', style: TextStyle(fontWeight: FontWeight.bold, color: DriverColors.primary)),
            onPressed: _autoFillDemoDocuments,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  children: [
                    BrandAssets.logo(size: 48, radius: 10),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('LiteSpark Partner Onboarding', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                          Text('Upload verified documents & vehicle images', style: TextStyle(fontSize: 12, color: Colors.black54)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Notice
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.verified_user_outlined, color: Colors.amber, size: 22),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Your profile will be placed in Pending status until reviewed and approved by the LiteSpark Operations team.',
                          style: TextStyle(fontSize: 12, color: Colors.brown, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // ── Section 1: Personal Details ──
                _buildSectionHeader('1. Personal Details', Icons.person_outline),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameController,
                  decoration: _inputDecoration('Full Name (as per Licence/Aadhaar)'),
                  validator: (v) => (v == null || v.trim().length < 2) ? 'Enter your full name' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _inputDecoration('Email Address'),
                  validator: (v) => (v != null && v.isNotEmpty && !v.contains('@')) ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneController,
                  enabled: false,
                  decoration: _inputDecoration('Mobile Phone Number (Verified)'),
                ),
                const SizedBox(height: 24),

                // ── Section 2: ID & Licence ──
                _buildSectionHeader('2. Identification Documents', Icons.badge_outlined),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _aadhaarController,
                  decoration: _inputDecoration('Aadhaar Card Number (12 digits)'),
                  validator: (v) => (v == null || v.trim().length < 8) ? 'Enter valid Aadhaar number' : null,
                ),
                const SizedBox(height: 10),
                _buildImageUploadBox(
                  label: 'Aadhaar Card Photo',
                  imageUrl: _aadhaarImage,
                  onSelect: (url) => setState(() => _aadhaarImage = url),
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _licenseController,
                  decoration: _inputDecoration('Driving Licence Number'),
                  validator: (v) => (v == null || v.trim().length < 5) ? 'Enter valid Licence number' : null,
                ),
                const SizedBox(height: 10),
                _buildImageUploadBox(
                  label: 'Driving Licence Photo',
                  imageUrl: _licenseImage,
                  onSelect: (url) => setState(() => _licenseImage = url),
                ),
                const SizedBox(height: 24),

                // ── Section 3: Vehicle Information ──
                _buildSectionHeader('3. Vehicle Information', Icons.directions_car_outlined),
                const SizedBox(height: 12),

                if (_categories.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    decoration: _inputDecoration('Vehicle Category'),
                    items: _categories.map((c) {
                      final id = (c['id'] ?? c['code']).toString();
                      final name = c['name'] ?? id;
                      return DropdownMenuItem<String>(
                        value: id,
                        child: Text(name),
                      );
                    }).toList(),
                    onChanged: (v) => setState(() => _selectedCategory = v ?? _selectedCategory),
                  ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _regNumberController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: _inputDecoration('Registration Number (e.g. TN38AB1234)'),
                  validator: (v) => (v == null || v.trim().length < 4) ? 'Enter vehicle plate number' : null,
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _modelController,
                        decoration: _inputDecoration('Model (e.g. Dzire / Auto)'),
                        validator: (v) => (v == null || v.trim().length < 2) ? 'Enter vehicle model' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _colorController,
                        decoration: _inputDecoration('Color'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // ── Section 4: Vehicle 4-Side Images ──
                _buildSectionHeader('4. Vehicle 4-Side Photos', Icons.camera_alt_outlined),
                const SizedBox(height: 8),
                const Text(
                  'Upload clear photos of all four sides of the vehicle for inspection:',
                  style: TextStyle(fontSize: 12, color: Colors.black54),
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: _buildImageUploadBox(
                        label: 'Front View',
                        imageUrl: _vehicleFrontImage,
                        onSelect: (url) => setState(() => _vehicleFrontImage = url),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildImageUploadBox(
                        label: 'Rear View',
                        imageUrl: _vehicleBackImage,
                        onSelect: (url) => setState(() => _vehicleBackImage = url),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildImageUploadBox(
                        label: 'Left Side',
                        imageUrl: _vehicleLeftImage,
                        onSelect: (url) => setState(() => _vehicleLeftImage = url),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildImageUploadBox(
                        label: 'Right Side',
                        imageUrl: _vehicleRightImage,
                        onSelect: (url) => setState(() => _vehicleRightImage = url),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                _buildSectionHeader('5. Choose Your Earnings Plan', Icons.monetization_on_outlined),
                const SizedBox(height: 8),
                const Text(
                  'Select how you want to earn. You can switch your plan anytime in the app.',
                  style: TextStyle(fontSize: 13, color: Colors.black54),
                ),
                const SizedBox(height: 12),

                // 3 Plans
                _buildPlanSelectionCard(
                  id: 'daily_sub_29',
                  badge: 'POPULAR (0% COMMISSION)',
                  badgeColor: Colors.green.shade700,
                  title: 'Daily Unlimited Pass',
                  fee: '₹29 / day',
                  subtitle: 'Pay ₹29/day or ₹699/month. 0% commission on every ride — you keep 100% of customer fare!',
                  features: ['0% platform fee', 'Direct rider payments', 'Unlimited trips per day'],
                ),
                const SizedBox(height: 10),
                _buildPlanSelectionCard(
                  id: 'flat_fee_15',
                  badge: 'FIXED FEE',
                  badgeColor: Colors.blue.shade700,
                  title: 'Flat Booking Fee',
                  fee: '₹15 / ride',
                  subtitle: 'Flat ₹15 fee per completed trip. No matter the ride fare (₹100 or ₹1000), platform fee is always ₹15.',
                  features: ['No percentage cuts', 'Great for high-fare rides', 'Pay as you complete'],
                ),
                const SizedBox(height: 10),
                _buildPlanSelectionCard(
                  id: 'commission_15',
                  badge: 'PAY AS YOU GO',
                  badgeColor: Colors.orange.shade800,
                  title: 'Standard Commission',
                  fee: '15% per trip',
                  subtitle: 'Traditional 15% platform commission deducted automatically. Ideal if you drive part-time.',
                  features: ['No upfront cost', 'No fixed daily fee', 'Ideal for weekend drivers'],
                ),

                if (_error != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                  ),
                ],

                const SizedBox(height: 32),

                ElevatedButton(
                  onPressed: _loading ? null : _submitRegistration,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: DriverColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : const Text(
                          'SUBMIT FOR APPROVAL',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: DriverColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: DriverColors.primaryDark),
        ),
      ],
    );
  }

  Widget _buildPlanSelectionCard({
    required String id,
    required String badge,
    required Color badgeColor,
    required String title,
    required String fee,
    required String subtitle,
    required List<String> features,
  }) {
    final isSelected = _selectedPlan == id;

    return InkWell(
      onTap: () => setState(() => _selectedPlan = id),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? DriverColors.primary.withOpacity(0.06) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? DriverColors.primary : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: DriverColors.primary.withOpacity(0.12), blurRadius: 8, offset: const Offset(0, 3))]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor, letterSpacing: 0.5),
                  ),
                ),
                const Spacer(),
                Text(
                  fee,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: DriverColors.primaryDark),
                ),
                const SizedBox(width: 8),
                Icon(
                  isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: isSelected ? DriverColors.primary : Colors.grey.shade400,
                  size: 22,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade700, height: 1.3),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: features
                  .map((f) => Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check, size: 14, color: Colors.green.shade700),
                          const SizedBox(width: 4),
                          Text(f, style: TextStyle(fontSize: 11, color: Colors.grey.shade800, fontWeight: FontWeight.w500)),
                        ],
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      filled: true,
      fillColor: DriverColors.lightBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
  }

  Widget _buildImageUploadBox({
    required String label,
    required String? imageUrl,
    required ValueChanged<String> onSelect,
  }) {
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;

    return InkWell(
      onTap: () {
        // Quick upload helper / sample picker
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Upload $label'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Choose an option for testing or upload photo:'),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.photo_library, color: DriverColors.primary),
                  title: const Text('Use Sample Verified Photo'),
                  onTap: () {
                    onSelect('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600');
                    Navigator.pop(ctx);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.link, color: DriverColors.accent),
                  title: const Text('Enter Custom Image URL'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _promptCustomUrl(label, onSelect);
                  },
                ),
              ],
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: hasImage ? Colors.purple.shade50 : DriverColors.lightBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasImage ? DriverColors.primary : DriverColors.border,
            width: hasImage ? 1.5 : 1,
          ),
        ),
        child: hasImage
            ? Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: DriverColors.online, size: 28),
                        const SizedBox(height: 4),
                        Text(
                          label,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: DriverColors.primaryDark),
                          textAlign: TextAlign.center,
                        ),
                        const Text('Uploaded', style: TextStyle(fontSize: 10, color: Colors.black45)),
                      ],
                    ),
                  ),
                  Positioned(
                    right: 4,
                    top: 4,
                    child: Icon(Icons.edit, size: 14, color: Colors.purple.shade400),
                  ),
                ],
              )
            : Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add_a_photo_outlined, color: Colors.black45, size: 24),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: const TextStyle(fontSize: 11, color: Colors.black54),
                      textAlign: TextAlign.center,
                    ),
                    const Text('Tap to Upload', style: TextStyle(fontSize: 10, color: DriverColors.primary)),
                  ],
                ),
              ),
      ),
    );
  }

  void _promptCustomUrl(String label, ValueChanged<String> onSelect) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$label URL'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'https://...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                onSelect(controller.text.trim());
              }
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

