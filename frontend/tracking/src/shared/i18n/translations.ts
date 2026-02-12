export const translations = {
  id: {
    // Header & Footer
    appName: 'TMS Onward',
    tagline: 'Track Your Shipment',
    poweredBy: 'Didukung oleh',

    // Navigation
    trackAnother: 'Lacak Lagi',

    // Form
    enterOrderNumber: 'Masukkan nomor order',
    trackShipment: 'Lacak Pengiriman',
    trackButton: 'Lacak',

    // Status Labels
    statusDraft: 'Draft',
    statusPending: 'Pending',
    statusConfirmed: 'Dikonfirmasi',
    statusAssigned: 'Ditugaskan',
    statusInProgress: 'Dalam Perjalanan',
    statusInTransit: 'Dalam Perjalanan',
    statusCompleted: 'Selesai',
    statusCancelled: 'Dibatalkan',
    statusFailed: 'Gagal',

    // Waypoint Types
    typePickup: 'Penjemputan',
    typeDelivery: 'Pengantaran',

    // Tracking Result
    trackingResult: 'Hasil Pelacakan',
    orderNumber: 'Nomor Order',
    customer: 'Pelanggan',
    createdDate: 'Tanggal Dibuat',

    // Trip Info
    tripInfo: 'Informasi Perjalanan',
    tripNumber: 'Nomor Perjalanan',
    driver: 'Pengemudi',
    vehicle: 'Kendaraan',
    inTransit: 'Dalam Perjalanan',
    privacyNote: 'Untuk keamanan Anda, hanya nama depan pengemudi yang ditampilkan',

    // Waypoint Timeline
    trackingTimeline: 'Timeline Pelacakan',
    noTrackingUpdates: 'Belum ada update pelacakan',
    receivedBy: 'Diterima oleh',
    reason: 'Alasan',

    // POD
    pod: 'Bukti Pengiriman',
    deliveredTo: 'Diterima oleh',
    signature: 'Tanda Tangan',
    photo: 'Foto',

    // Error Messages
    orderNotFound: 'Order Tidak Ditemukan',
    orderNotFoundDesc: 'Tidak ditemukan order dengan nomor',
    tryAgain: 'Coba Lagi',
    serverError: 'Kesalahan Server',
    unableToLoad: 'Tidak Dapat Memuat Data',

    // Validation
    orderNumberRequired: 'Nomor order harus diisi',
    orderNumberMinLength: 'Nomor order minimal 3 karakter',

    // Empty States
    noPODYet: 'Bukti pengiriman akan muncul di sini setelah pengantaran',
    noTripYet: 'Belum ada perjalanan yang ditugaskan',
  },
  en: {
    // Header & Footer
    appName: 'TMS Onward',
    tagline: 'Track Your Shipment',
    poweredBy: 'Powered by',

    // Navigation
    trackAnother: 'Track Another',

    // Form
    enterOrderNumber: 'Enter your order number',
    trackShipment: 'Track Your Shipment',
    trackButton: 'Track',

    // Status Labels
    statusDraft: 'Draft',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusAssigned: 'Assigned',
    statusInProgress: 'In Progress',
    statusInTransit: 'In Transit',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusFailed: 'Failed',

    // Waypoint Types
    typePickup: 'Pickup',
    typeDelivery: 'Delivery',

    // Tracking Result
    trackingResult: 'Tracking Result',
    orderNumber: 'Order Number',
    customer: 'Customer',
    createdDate: 'Created Date',

    // Trip Info
    tripInfo: 'Trip Information',
    tripNumber: 'Trip Number',
    driver: 'Driver',
    vehicle: 'Vehicle',
    inTransit: 'In Transit',
    privacyNote: 'For your safety, only driver\'s first name is shown',

    // Waypoint Timeline
    trackingTimeline: 'Tracking Timeline',
    noTrackingUpdates: 'No tracking updates available yet',
    receivedBy: 'Received by',
    reason: 'Reason',

    // POD
    pod: 'Proof of Delivery',
    deliveredTo: 'Delivered to',
    signature: 'Signature',
    photo: 'Photo',

    // Error Messages
    orderNotFound: 'Order Not Found',
    orderNotFoundDesc: 'No order found with number',
    tryAgain: 'Try Again',
    serverError: 'Server Error',
    unableToLoad: 'Unable to Load Data',

    // Validation
    orderNumberRequired: 'Order number is required',
    orderNumberMinLength: 'Order number must be at least 3 characters',

    // Empty States
    noPODYet: 'POD will appear here after delivery',
    noTripYet: 'No trip has been assigned yet',
  },
} as const;

export type Language = 'id' | 'en';
export type TranslationKey = keyof typeof translations.id;
