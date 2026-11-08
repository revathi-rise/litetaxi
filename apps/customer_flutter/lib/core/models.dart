// Data models for SwiftCab customer app

class PlaceResult {
  final String id;
  final String name;
  final String address;
  final double lat;
  final double lng;

  PlaceResult({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });

  factory PlaceResult.fromJson(Map<String, dynamic> j) => PlaceResult(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        address: j['address']?.toString() ?? '',
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
      );
}

class VehicleOption {
  final String estimateId;
  final String categoryId;
  final String categoryName;
  final String categoryCode;
  final int capacity;
  final String? imageUrl;
  final String fareTotal;
  final List<Map<String, dynamic>> fareLines;
  final bool minimumFareApplied;
  final int tripDurationMin;
  final bool available;
  final int driversNearby;
  final int? etaMinutes;

  VehicleOption({
    required this.estimateId,
    required this.categoryId,
    required this.categoryName,
    required this.categoryCode,
    required this.capacity,
    this.imageUrl,
    required this.fareTotal,
    required this.fareLines,
    required this.minimumFareApplied,
    required this.tripDurationMin,
    required this.available,
    required this.driversNearby,
    this.etaMinutes,
  });

  factory VehicleOption.fromJson(Map<String, dynamic> j) {
    final cat = j['category'] as Map<String, dynamic>? ?? {};
    final fare = j['fare'] as Map<String, dynamic>? ?? {};
    final lines = (fare['lines'] as List? ?? []).cast<Map<String, dynamic>>();
    return VehicleOption(
      estimateId: j['estimateId']?.toString() ?? '',
      categoryId: cat['id']?.toString() ?? '',
      categoryName: cat['name']?.toString() ?? '',
      categoryCode: cat['code']?.toString() ?? '',
      capacity: (cat['capacity'] as num?)?.toInt() ?? 4,
      imageUrl: cat['imageUrl']?.toString(),
      fareTotal: fare['total']?.toString() ?? '0',
      fareLines: lines,
      minimumFareApplied: fare['minimumFareApplied'] == true,
      tripDurationMin: (j['tripDurationMin'] as num?)?.toInt() ?? 0,
      available: j['available'] == true,
      driversNearby: (j['driversNearby'] as num?)?.toInt() ?? 0,
      etaMinutes: (j['etaMinutes'] as num?)?.toInt(),
    );
  }
}

class FareEstimate {
  final List<VehicleOption> options;
  final double distanceKm;
  final int durationMin;
  final List<List<double>> geometry;

  FareEstimate({
    required this.options,
    required this.distanceKm,
    required this.durationMin,
    required this.geometry,
  });

  factory FareEstimate.fromJson(Map<String, dynamic> j) {
    final route = j['route'] as Map<String, dynamic>? ?? {};
    final geoRaw = (route['geometry'] as List? ?? []);
    final geo = geoRaw.map<List<double>>((p) {
      if (p is List && p.length >= 2) {
        final a = (p[0] as num).toDouble();
        final b = (p[1] as num).toDouble();
        // Backend returns [lng, lat] GeoJSON format -> normalize to [lat, lng]
        if (a > 50 && b < 40) {
          return <double>[b, a];
        }
        return <double>[a, b];
      }
      return <double>[0.0, 0.0];
    }).toList();
    return FareEstimate(
      options: (j['options'] as List? ?? []).map((o) => VehicleOption.fromJson(o as Map<String, dynamic>)).toList(),
      distanceKm: (route['distanceKm'] as num?)?.toDouble() ?? 0,
      durationMin: (route['durationMin'] as num?)?.toInt() ?? 0,
      geometry: geo,
    );
  }
}

class DriverInfo {
  final String name;
  final String phone;
  final String rating;
  final String vehicleModel;
  final String vehiclePlate;
  final String vehicleColor;

  DriverInfo({
    required this.name,
    required this.phone,
    required this.rating,
    required this.vehicleModel,
    required this.vehiclePlate,
    required this.vehicleColor,
  });

  factory DriverInfo.fromJson(Map<String, dynamic>? j) {
    if (j == null) return DriverInfo(name: '', phone: '', rating: '', vehicleModel: '', vehiclePlate: '', vehicleColor: '');
    final v = j['vehicle'] as Map<String, dynamic>? ?? {};
    return DriverInfo(
      name: j['name']?.toString() ?? '',
      phone: j['phone']?.toString() ?? '',
      rating: j['rating']?.toString() ?? '',
      vehicleModel: v['model']?.toString() ?? '',
      vehiclePlate: (v['plate'] ?? v['registrationNumber'])?.toString() ?? '',
      vehicleColor: v['color']?.toString() ?? '',
    );
  }
}

class DriverLocation {
  final double lat;
  final double lng;
  final double? heading;

  DriverLocation({required this.lat, required this.lng, this.heading});

  factory DriverLocation.fromJson(Map<String, dynamic>? j) {
    if (j == null) return DriverLocation(lat: 0, lng: 0);
    return DriverLocation(
      lat: (j['lat'] as num?)?.toDouble() ?? 0,
      lng: (j['lng'] as num?)?.toDouble() ?? 0,
      heading: (j['heading'] as num?)?.toDouble(),
    );
  }
}

class BookingSnapshot {
  final String id;
  final String reference;
  final String status;
  final String? startOtp;
  final String? categoryName;
  final String? estimatedTotal;
  final String? finalTotal;
  final DriverInfo? driver;
  final DriverLocation? driverLocation;
  final Map<String, dynamic> pickup;
  final Map<String, dynamic> dropoff;
  final String? paymentMethod;
  final DateTime createdAt;
  final int? etaMinutes;
  final List<List<double>> route; // [[lat,lng],...]

  BookingSnapshot({
    required this.id,
    required this.reference,
    required this.status,
    this.startOtp,
    this.categoryName,
    this.estimatedTotal,
    this.finalTotal,
    this.driver,
    this.driverLocation,
    required this.pickup,
    required this.dropoff,
    this.paymentMethod,
    required this.createdAt,
    this.etaMinutes,
    this.route = const [],
  });

  factory BookingSnapshot.fromJson(Map<String, dynamic> j) {
    final cat = j['category'] as Map<String, dynamic>? ?? {};
    final est = j['estimated'] as Map<String, dynamic>? ?? j['fare'] as Map<String, dynamic>? ?? {};
    final fin = j['final'] as Map<String, dynamic>?;
    final drv = j['driver'] as Map<String, dynamic>?;
    final locJson = (drv?['location'] ?? j['driverLocation']) as Map<String, dynamic>?;
    final pay = j['payment'] as Map<String, dynamic>?;
    // API geometry is [[lng,lat],...] -> normalize to [lat,lng]
    final routeRaw = (j['route'] as List? ?? []);
    final route = routeRaw
        .where((p) => p is List && p.length >= 2)
        .map<List<double>>((p) {
          final a = (p[0] as num).toDouble();
          final b = (p[1] as num).toDouble();
          if (a > 50 && b < 40) {
            return <double>[b, a];
          }
          return <double>[a, b];
        })
        .toList();
    return BookingSnapshot(
      id: j['id']?.toString() ?? '',
      reference: j['reference']?.toString() ?? '',
      status: j['status']?.toString() ?? '',
      startOtp: j['startOtp']?.toString(),
      categoryName: cat['name']?.toString(),
      estimatedTotal: est['total']?.toString(),
      finalTotal: fin?['total']?.toString(),
      driver: drv != null ? DriverInfo.fromJson(drv) : null,
      driverLocation: locJson != null ? DriverLocation.fromJson(locJson) : null,
      pickup: (j['pickup'] as Map<String, dynamic>? ?? {}),
      dropoff: (j['dropoff'] as Map<String, dynamic>? ?? {}),
      paymentMethod: (pay?['method'] ?? j['paymentMethod'])?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      etaMinutes: (j['etaMinutes'] as num?)?.toInt(),
      route: route,
    );
  }

  bool get isTerminal => ['COMPLETED', 'CANCELLED', 'NO_DRIVER', 'NO_DRIVER_AVAILABLE'].contains(status);
  bool get isActive => !isTerminal;
}

class NavigationStep {
  final String instruction;
  final String maneuver; // TURN_LEFT, TURN_RIGHT, STRAIGHT, U_TURN, etc.
  final int distanceMeters;
  final double? lat;
  final double? lng;

  NavigationStep({
    required this.instruction,
    required this.maneuver,
    required this.distanceMeters,
    this.lat,
    this.lng,
  });

  factory NavigationStep.fromJson(Map<String, dynamic> j) {
    final loc = j['location'];
    double? lat, lng;
    if (loc is List && loc.length >= 2) {
      lat = (loc[0] as num).toDouble();
      lng = (loc[1] as num).toDouble();
    } else if (loc is Map) {
      lat = (loc['latitude'] ?? loc['lat']) as double?;
      lng = (loc['longitude'] ?? loc['lng']) as double?;
    }
    return NavigationStep(
      instruction: j['instruction']?.toString() ?? 'Continue along the route',
      maneuver: j['maneuver']?.toString() ?? 'STRAIGHT',
      distanceMeters: (j['distanceMeters'] as num?)?.toInt() ?? 100,
      lat: lat,
      lng: lng,
    );
  }
}

class RideHistoryItem {
  final String id;
  final String reference;
  final String status;
  final String pickup;
  final String dropoff;
  final String total;
  final String? categoryName;
  final DateTime createdAt;

  RideHistoryItem({
    required this.id,
    required this.reference,
    required this.status,
    required this.pickup,
    required this.dropoff,
    required this.total,
    this.categoryName,
    required this.createdAt,
  });

  factory RideHistoryItem.fromJson(Map<String, dynamic> j) {
    final cat = j['category'] as Map<String, dynamic>? ?? {};
    return RideHistoryItem(
      id: j['id']?.toString() ?? '',
      reference: j['reference']?.toString() ?? '',
      status: j['status']?.toString() ?? '',
      pickup: (j['pickup'] as Map?)?.containsKey('address') == true
          ? j['pickup']['address']?.toString() ?? 'Pickup'
          : 'Pickup',
      dropoff: (j['dropoff'] as Map?)?.containsKey('address') == true
          ? j['dropoff']['address']?.toString() ?? 'Drop-off'
          : 'Drop-off',
      total: j['total']?.toString() ?? '0',
      categoryName: cat['name']?.toString() ?? j['category']?.toString(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt']) ?? DateTime.now() : DateTime.now(),
    );
  }
}

// Pan-India & Tamil Nadu preset places
const List<Map<String, dynamic>> kPresetPlaces = [
  // Pollachi & Odayakulam Region (Primary)
  {'name': 'Odayakulam (Pollachi)', 'address': 'Odayakulam Town Panchayat, Pollachi, Coimbatore, Tamil Nadu 642129', 'lat': 10.5931, 'lng': 76.9058},
  {'name': 'Pollachi Bus Stand', 'address': 'Central Bus Stand, Pollachi, Coimbatore, Tamil Nadu 642001', 'lat': 10.6600, 'lng': 77.0070},
  {'name': 'Anaimalai', 'address': 'Anaimalai Town, Pollachi Taluk, Coimbatore, Tamil Nadu 642104', 'lat': 10.5833, 'lng': 76.9333},
  {'name': 'Valparai Hill Station', 'address': 'Valparai, Coimbatore, Tamil Nadu 642127', 'lat': 10.3264, 'lng': 76.9554},
  {'name': 'Kinathukadavu', 'address': 'Kinathukadavu, Coimbatore, Tamil Nadu 642109', 'lat': 10.8202, 'lng': 77.0195},
  {'name': 'Eachanari Vinayagar Temple', 'address': 'Pollachi Main Rd, Eachanari, Coimbatore, Tamil Nadu 641021', 'lat': 10.9252, 'lng': 76.9820},
  {'name': 'Eachanari Junction', 'address': 'Pollachi Main Road, Eachanari, Coimbatore', 'lat': 10.9265, 'lng': 76.9818},
  {'name': 'Sundarapuram', 'address': 'Sundarapuram, Pollachi Main Rd, Coimbatore', 'lat': 10.9535, 'lng': 76.9748},
  {'name': 'Kuniyamuthur', 'address': 'Palakkad Main Rd, Kuniyamuthur, Coimbatore', 'lat': 10.9630, 'lng': 76.9530},
  {'name': 'Malumichampatti', 'address': 'Chettipalayam Rd, Malumichampatti, Coimbatore', 'lat': 10.8980, 'lng': 77.0080},
  {'name': 'Ukkadam Bus Stand', 'address': 'Ukkadam, Coimbatore, Tamil Nadu', 'lat': 10.9902, 'lng': 76.9604},
  {'name': 'Town Hall', 'address': 'Town Hall, Coimbatore, Tamil Nadu', 'lat': 10.9960, 'lng': 76.9630},
  {'name': 'Gandhipuram Bus Stand', 'address': 'Gandhipuram Central Bus Stand, Coimbatore, Tamil Nadu', 'lat': 11.0168, 'lng': 76.9558},
  {'name': 'Cross Cut Road', 'address': 'Cross Cut Road, Gandhipuram, Coimbatore 641012', 'lat': 11.0185, 'lng': 76.9630},
  {'name': '100 Feet Road', 'address': '100 Feet Road, Gandhipuram, Tatabad, Coimbatore', 'lat': 11.0210, 'lng': 76.9640},
  {'name': 'RS Puram (CBE)', 'address': 'DB Road, RS Puram, Coimbatore', 'lat': 11.0080, 'lng': 76.9420},
  {'name': 'Coimbatore Junction', 'address': 'State Bank Road, Gopalapuram, Coimbatore', 'lat': 11.0016, 'lng': 76.9629},
  {'name': 'CBE Airport (CJB)', 'address': 'Coimbatore International Airport, Peelamedu', 'lat': 11.0300, 'lng': 77.0434},
  {'name': 'Tidel Park (Coimbatore)', 'address': 'Peelamedu, Coimbatore, Tamil Nadu', 'lat': 11.0285, 'lng': 77.0267},
  {'name': 'Saibaba Colony', 'address': 'NSR Road, Saibaba Colony, Coimbatore', 'lat': 11.0280, 'lng': 76.9460},
  {'name': 'Brookefields Mall', 'address': 'Dr Krishnasamy Mudaliar Rd, Coimbatore', 'lat': 11.0090, 'lng': 76.9580},
  {'name': 'Prozone Mall', 'address': 'Sathy Rd, Saravanampatti, Coimbatore', 'lat': 11.0540, 'lng': 76.9940},
  {'name': 'Gandhi Park (RS Puram)', 'address': 'DB Road, Sukrawarpettai, RS Puram, Coimbatore, Tamil Nadu 641001', 'lat': 11.0069, 'lng': 76.9463},
  // Chennai
  {'name': 'Chennai Central', 'address': 'Park Town, Chennai, Tamil Nadu', 'lat': 13.0827, 'lng': 80.2755},
  {'name': 'Chennai Airport (MAA)', 'address': 'Meenambakkam, Chennai, Tamil Nadu', 'lat': 12.9941, 'lng': 80.1709},
  {'name': 'T. Nagar (Chennai)', 'address': 'T. Nagar, Chennai', 'lat': 13.0418, 'lng': 80.2341},
  {'name': 'Marina Beach', 'address': 'Marina Beach Rd, Chennai', 'lat': 13.0500, 'lng': 80.2824},
  // Bengaluru
  {'name': 'Koramangala (BLR)', 'address': 'Sony World Signal, Koramangala, Bengaluru', 'lat': 12.9352, 'lng': 77.6245},
  {'name': 'BLR Airport (KIA)', 'address': 'Devanahalli, Bengaluru, Karnataka', 'lat': 13.1986, 'lng': 77.7066},
  {'name': 'Whitefield (BLR)', 'address': 'ITPB Whitefield, Bengaluru', 'lat': 12.9866, 'lng': 77.7381},
  {'name': 'Indiranagar (BLR)', 'address': '100ft Road, Indiranagar, Bengaluru', 'lat': 12.9719, 'lng': 77.6412},
  // Mumbai
  {'name': 'Mumbai Airport (BOM)', 'address': 'T2 CSMIA, Andheri East, Mumbai', 'lat': 19.0896, 'lng': 72.8656},
  {'name': 'Bandra Kurla Complex', 'address': 'BKC, Bandra East, Mumbai', 'lat': 19.0657, 'lng': 72.8687},
  // Pune
  {'name': 'Pune Airport (PNQ)', 'address': 'Lohegaon, Pune, Maharashtra', 'lat': 18.5822, 'lng': 73.9197},
  {'name': 'Hinjawadi IT Park', 'address': 'Rajiv Gandhi Infotech Park, Pune', 'lat': 18.5913, 'lng': 73.7389},
  // Delhi
  {'name': 'Connaught Place (Delhi)', 'address': 'Central Delhi, New Delhi', 'lat': 28.6304, 'lng': 77.2177},
  {'name': 'Delhi Airport (DEL)', 'address': 'IGI Airport, Palam, New Delhi', 'lat': 28.5562, 'lng': 77.1000},
  {'name': 'Cyber City (Gurugram)', 'address': 'DLF Phase 2, Gurugram, Haryana', 'lat': 28.4952, 'lng': 77.0895},
  // Hyderabad
  {'name': 'Hitec City (HYD)', 'address': 'Cyber Towers, Madhapur, Hyderabad', 'lat': 17.4504, 'lng': 78.3808},
  {'name': 'Hyderabad Airport (HYD)', 'address': 'Shamshabad, Hyderabad', 'lat': 17.2403, 'lng': 78.4294},
  // Kochi
  {'name': 'Kochi Airport (COK)', 'address': 'Nedumbassery, Kochi, Kerala', 'lat': 10.1518, 'lng': 76.3930},
  {'name': 'Infopark Kakkanad', 'address': 'Kakkanad, Kochi, Kerala', 'lat': 10.0104, 'lng': 76.3608},
  // Kolkata
  {'name': 'Howrah Station', 'address': 'Howrah, Kolkata, West Bengal', 'lat': 22.5850, 'lng': 88.3426},
  {'name': 'Park Street (Kolkata)', 'address': 'Central Kolkata', 'lat': 22.5510, 'lng': 88.3524},
];
