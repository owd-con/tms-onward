import { MainLayout } from '@/components/layout';
import { TrackingResult } from '@/components/tracking';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/**
 * Public Tracking Result Page
 * Displays detailed tracking information for a specific order
 *
 * SEO Optimized with:
 * - Dynamic meta title with order number
 * - Dynamic meta description
 * - Open Graph tags
 * - Canonical URL with order number
 */
export function TrackingResultPage() {
  const { code } = useParams<{ code: string }>();

  if (!code) {
    return (
      <MainLayout>
        <div className="text-center py-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Request
          </h2>
          <p className="text-gray-600 mb-6">
            Order or shipment number is required to track your shipment.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Tracking Page
          </a>
        </div>
      </MainLayout>
    );
  }

  const canonicalUrl = `${window.location.origin}/tracking/${code}`;
  const displayCode = code.toUpperCase();

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>Track {displayCode} - TMS Onward</title>
        <meta
          name="description"
          content={`Track ${displayCode} status. View delivery timeline, proof of delivery, driver information, and trip details with TMS Onward.`}
        />
        <meta
          name="keywords"
          content={`order ${displayCode}, shipment tracking, delivery status, ${displayCode} tracking`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={`Tracking ${displayCode}`}
        />
        <meta
          property="og:description"
          content={`Track ${displayCode} status with TMS Onward - View delivery timeline and proof of delivery.`}
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${window.location.origin}/og-image.jpg`}
        />
        <meta property="og:site_name" content="TMS Onward" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Tracking ${displayCode}`} />
        <meta
          name="twitter:description"
          content={`Track ${displayCode} status with TMS Onward`}
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

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ParcelDelivery',
            trackingUrl: canonicalUrl,
            deliveryStatus: 'InTransit',
            hasPart: [
              {
                '@type': 'DeliveryEvent',
                name: 'Shipment Tracking',
                description: `Track ${displayCode} with TMS Onward`,
              },
            ],
          })}
        </script>
      </Helmet>

      <MainLayout>
        <div className="animate-fadeIn">
          <TrackingResult orderNumber={code} />
        </div>
      </MainLayout>
    </>
  );
}

export default TrackingResultPage;
