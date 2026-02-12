import { MainLayout } from '@/components/layout';
import { TrackingForm } from '@/components/tracking';
import { Helmet } from 'react-helmet-async';

/**
 * Public Tracking Page - Home
 * Entry point for public order tracking
 *
 * SEO Optimized with:
 * - Meta title and description
 * - Open Graph tags for social sharing
 * - Canonical URL
 */
export function TrackingPage() {
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>TMS Onward - Track Your Shipment</title>
        <meta
          name="description"
          content="Track your shipment online with TMS Onward. Get real-time updates on your delivery status, view timeline, and access proof of delivery."
        />
        <meta
          name="keywords"
          content="shipment tracking, order tracking, delivery status, TMS Onward, logistics tracking, package tracking Indonesia"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TMS Onward - Track Your Shipment" />
        <meta
          property="og:description"
          content="Track your shipment online with TMS Onward. Get real-time updates on your delivery status."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${window.location.origin}/og-image.jpg`}
        />
        <meta property="og:site_name" content="TMS Onward" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TMS Onward - Track Your Shipment" />
        <meta
          name="twitter:description"
          content="Track your shipment online with TMS Onward. Get real-time updates on your delivery status."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/og-image.jpg`}
        />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="theme-color" content="#0d9488" />
      </Helmet>

      <MainLayout>
        <div className="min-h-[60vh] flex flex-col justify-center animate-fadeIn">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Track Your Shipment
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your order number to get real-time updates on your delivery
              status, view timeline, and access proof of delivery.
            </p>
          </div>

          {/* Tracking Form */}
          <div className="max-w-xl mx-auto">
            <TrackingForm />
          </div>

          {/* Features Section */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Real-Time Updates
              </h3>
              <p className="text-sm text-gray-600">
                Get instant status updates on your shipment
              </p>
            </div>

            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Proof of Delivery
              </h3>
              <p className="text-sm text-gray-600">
                View photos and signatures upon delivery
              </p>
            </div>

            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Live Tracking
              </h3>
              <p className="text-sm text-gray-600">
                Follow your shipment journey in real-time
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export default TrackingPage;
