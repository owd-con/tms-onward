/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import { useTrip } from "@/services/trip/hooks";
import type { Trip, TripWaypoint } from "@/services/types";

import Logo from "@/assets/logo_dark.svg";
import { currencyFormat, dateFormat } from "@/utils/common";
import Print from "@/utils/print";
import { useParams } from "react-router-dom";
import { renderToString } from "react-dom/server";

/**
 * TMS Onward - Print Trip Screen (Manifest Style)
 *
 * Print trip sheet/manifest yang berisi informasi trip, driver, vehicle, dan waypoints.
 * Menggunakan layout manifest dari example.
 *
 * URL format: /print/trip/:tripId
 *
 * Menggunakan direct render dengan React components (QRCode, Barcode).
 */
const PrintTripScreen = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [waypoints, setWaypoints] = useState<TripWaypoint[]>([]);

  const { show: showTrip, showResult: showTripResult } = useTrip();

  const onLoad = () => {
    showTrip({ id: tripId as string });
  };

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    if (showTripResult?.isSuccess) {
      const tripData = (showTripResult?.data as any)?.data;
      setTrip(tripData);

      if (tripData?.trip_waypoints && tripData.trip_waypoints.length > 0) {
        // Sort waypoints by sequence_number
        const sortedWaypoints = [...tripData.trip_waypoints].sort(
          (a: TripWaypoint, b: TripWaypoint) =>
            a.sequence_number - b.sequence_number
        );
        setWaypoints(sortedWaypoints);
      }
    }
  }, [showTripResult]);

  if (showTripResult?.isLoading || !trip) return null;

  // Calculate totals
  const totalKoli = waypoints.reduce((sum, wp) => {
    return (
      sum +
      (wp.shipments?.reduce((s, ship) => {
        return (
          s +
          (ship.items?.reduce((is, item) => is + (item.quantity || 0), 0) || 0)
        );
      }, 0) || 0)
    );
  }, 0);

  const totalWeight = waypoints.reduce((sum, wp) => {
    return (
      sum +
      (wp.shipments?.reduce((s, ship) => s + (ship.total_weight || 0), 0) || 0)
    );
  }, 0);

  return (
    <div>
      <Print
        title={`Manifest - ${trip?.trip_number || ""}`}
        size="A4"
        content={renderToString(
          <section className="sheet" style={{ padding: "20px" }}>
            {/* Header */}
            <div
              className="d-flex flex-row justify-content-between"
              style={{ height: 132 }}
            >
              <div style={{ width: "85%" }}>
                <div
                  className="d-flex align-items-center border-bottom"
                  style={{
                    paddingTop: 10,
                    paddingBottom: 10,
                  }}
                >
                  <div style={{ alignSelf: "initial", width: "30%" }}>
                    <img
                      src={Logo}
                      alt=""
                      style={{ maxHeight: 50, maxWidth: "100%" }}
                    />
                  </div>
                  <div style={{ paddingLeft: 20 }}>
                    <h2 className="bold uppercase">Manifest Trip</h2>
                    <p className="mb-0">
                      Nomor Trip : {trip.trip_number}
                    </p>
                    <p className="mb-0">
                      Tanggal :{" "}
                      {trip.started_at
                        ? dateFormat(trip.started_at, "DD-MM-YYYY")
                        : dateFormat(trip.created_at, "DD-MM-YYYY")}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ width: "15%" }}>
                <div className="d-flex flex-column justify-content-center text-center align-items-center">
                  <QRCode
                    value={trip.id}
                    bgColor="#fff"
                    fgColor="#000"
                    style={{ height: 120 }}
                  />
                  <p className="mb-0" style={{ fontSize: 9 }}>
                    {trip.trip_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Informasi Armada */}
            <table className="body" style={{ marginTop: -50 }}>
              <tr style={{ verticalAlign: "top" }}>
                <td style={{ width: "50%", paddingTop: "10px" }}>
                  <h5 className="bold uppercase">Informasi Armada :</h5>
                  <table style={{ marginBottom: "15px" }}>
                    <tr style={{ textAlign: "left" }}>
                      <td style={{ width: "25%", textAlign: "left" }}>
                        <p className="mb-0">Driver</p>
                      </td>
                      <td>
                        <p className="mb-0">:</p>
                      </td>
                      <td style={{ width: "70%", textAlign: "left" }}>
                        <p className="bold uppercase mb-0">
                          {trip.driver?.name || "-"}
                        </p>
                      </td>
                    </tr>
                    <tr style={{ textAlign: "left" }}>
                      <td>
                        <p className="mb-0">Kendaraan</p>
                      </td>
                      <td>
                        <p className="mb-0">:</p>
                      </td>
                      <td>
                        <p className="bold uppercase mb-0">
                          {trip.vehicle?.plate_number || trip.vehicle?.type || "-"}
                        </p>
                      </td>
                    </tr>
                    <tr style={{ textAlign: "left" }}>
                      <td>
                        <p className="mb-0">Status</p>
                      </td>
                      <td>
                        <p className="mb-0">:</p>
                      </td>
                      <td>
                        <p className="bold uppercase mb-0">
                          {trip.status.replace("_", " ")}
                        </p>
                      </td>
                    </tr>
                    <tr style={{ textAlign: "left" }}>
                      <td>
                        <p className="mb-0">Total Berat</p>
                      </td>
                      <td>
                        <p className="mb-0">:</p>
                      </td>
                      <td>
                        <p className="bold uppercase mb-0">
                          {currencyFormat(totalWeight)} (KG) -{" "}
                          {currencyFormat(totalKoli)} (Koli)
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            {/* Table Waypoints */}
            <div style={{ marginTop: 20 }}>
              <table className="bordered">
                <thead>
                  <tr className="bordered">
                    <td className="bordered center" style={{ width: "3%" }}>
                      <p className="bold mb-0">No.</p>
                    </td>
                    <td className="bordered left" style={{ width: "10%" }}>
                      <p className="bold mb-0">Pickup/Drop</p>
                    </td>
                    <td className="bordered left" style={{ width: "30%" }}>
                      <p className="bold mb-0">Lokasi</p>
                    </td>
                    <td className="bordered left" style={{ width: "12%" }}>
                      <p className="bold mb-0">Shipment</p>
                    </td>
                    <td className="bordered center" style={{ width: "30%" }}>
                      <p className="bold mb-0">Shipment Detail</p>
                    </td>
                    <td className="bordered center" style={{ width: "15%" }}>
                      <p className="bold mb-0">Status</p>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {waypoints.map((wp, index) => {
                    // Calculate commodity details for this waypoint
                    let commodityData: any[] = [];
                    let totalWeight = 0;
                    let totalQty = 0;

                    wp.shipments?.forEach((ship: any) => {
                      ship.items?.forEach((item: any) => {
                        const existing = commodityData.find(
                          (c) => c.item_name === item.name
                        );
                        if (existing) {
                          existing.quantity += item.quantity || 0;
                          existing.weight += item.weight || 0;
                        } else {
                          commodityData.push({
                            item_name: item.name,
                            quantity: item.quantity || 0,
                            weight: item.weight || 0,
                          });
                        }
                        totalQty += item.quantity || 0;
                        totalWeight += item.weight || 0;
                      });
                    });

                    return (
                      <tr key={wp.id} className="bordered">
                        <td className="bordered center">
                          <p className="mb-0">{index + 1}</p>
                        </td>
                        <td className="bordered left">
                          <p className="mb-0 text-capitalize">
                            {wp.type === "pickup" ? "PICKUP" : "DROP"}
                          </p>
                        </td>
                        <td className="bordered left">
                          <div className="table-col">
                            <p className="fs-8 mb-0 fw-semibold">
                              {wp.location_name || "-"} -{" "}
                              {wp.contact_phone || "-"}
                            </p>
                            <small className="info mb-0">
                              {wp.address || "-"}
                            </small>
                          </div>
                        </td>
                        <td className="bordered left">
                          <div className="table-col">
                            {wp.shipments?.map((ship: any, i: number) => (
                              <p key={i} className="mb-0">
                                {i + 1}. {ship.shipment_number || "-"}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="bordered">
                          <div className="table-col">
                            <p className="mb-0">
                              <b>Komoditas: </b>
                            </p>
                            {commodityData.map((item, i) => (
                              <p key={i} className="mb-0">
                                {i + 1}. {item.item_name || "-"} :{" "}
                                {currencyFormat(item.weight || 0)} Kg (
                                {currencyFormat(item.quantity || 0)} Koli)
                              </p>
                            ))}
                            <p>
                              <b>Total Berat: </b>
                              {currencyFormat(totalWeight)} Kg (
                              {currencyFormat(totalQty)} Koli)
                            </p>
                          </div>
                        </td>
                        <td className="bordered left">
                          <p className="mb-0" style={{ fontWeight: "bold" }}>
                            {wp.status.replace("_", " ").toUpperCase()}
                          </p>
                          {wp.completed_at && (
                            <p className="mb-0" style={{ fontSize: 8 }}>
                              {dateFormat(wp.completed_at, "DD/MM HH:mm")}
                            </p>
                          )}
                          {wp.received_by && (
                            <p className="mb-0" style={{ fontSize: 8 }}>
                              Diterima: {wp.received_by}
                            </p>
                          )}
                          {wp.failed_reason && (
                            <p
                              className="mb-0"
                              style={{ fontSize: 8, color: "red" }}
                            >
                              {wp.failed_reason}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature */}
            <div style={{ marginTop: 50 }}>
              <table style={{ width: "100%" }}>
                <tr>
                  <td style={{ width: "50%", textAlign: "center" }}>
                    <div style={{ fontSize: 10, marginBottom: 60 }}>Driver,</div>
                    <div style={{ fontSize: 10, fontWeight: "bold" }}>
                      ( {trip.driver?.name || "-"} )
                    </div>
                  </td>
                  <td style={{ width: "50%", textAlign: "center" }}>
                    <div style={{ fontSize: 10, marginBottom: 60 }}>Admin,</div>
                    <div style={{ fontSize: 10, fontWeight: "bold" }}>
                      ( ........................ )
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </section>,
        )}
      />
    </div>
  );
};

export default PrintTripScreen;
