/* eslint-disable react-hooks/exhaustive-de */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import QRCode from "react-qr-code";
import bwipjs from "bwip-js";

import { useOrder } from "@/services/order/hooks";
import type { Order, Shipment } from "@/services/types";

import Logo from "@/assets/logo_light.svg";
import { currencyFormat, dateFormat } from "@/utils/common";
import Print from "@/utils/print";
import { useParams } from "react-router-dom";
import { renderToString } from "react-dom/server";
import type { RootState } from "@/services/store";

/**
 * Helper function untuk generate barcode SVG string
 * Menggunakan bwip-js untuk berbagai format barcode
 */
const getBarcodeSVG = (
  text: string,
  options: {
    scale?: number;
    height?: number;
    barwidth?: number;
    textsize?: number;
    includeText?: boolean;
  } = {},
): string => {
  try {
    return (bwipjs as any).toSVG({
      bcid: "code128",
      text: text,
      scale: options.scale || 2,
      height: options.height || 10,
      includetext: options.includeText !== false,
      textxalign: "center",
    });
  } catch (e) {
    console.error("Barcode generation error:", e);
    return "";
  }
};

/**
 * TMS Onward - Print Resi Order Screen
 *
 * Print resi untuk SEMUA shipment dalam order.
 * Setiap shipment akan dicetak sebagai 1 resi (102mm x 127mm).
 *
 * URL format: /print/resi/order/:orderId
 *
 * Menggunakan direct render dengan React components (QRCode, Barcode).
 */
const PrintResiOrderScreen = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const { show: showOrder, showResult: showOrderResult } = useOrder();
  const Profile = useSelector((state: RootState) => state.userProfile);
  const companyLogo = Profile?.user?.company?.logo_url || Logo;

  const onLoad = () => {
    showOrder({ id: orderId as string });
  };

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    if (showOrderResult?.isSuccess) {
      const orderData = (showOrderResult?.data as any)?.data;
      setOrder(orderData);

      if (orderData?.shipments && orderData.shipments.length > 0) {
        setShipments(orderData.shipments);
      }
    }
  }, [showOrderResult]);

  if (showOrderResult?.isLoading || !order) return null;

  return (
    <div>
      <Print
        title={`Resi - ${order?.order_number || ""}`}
        size='RESI'
        content={renderToString(
          shipments?.map((shipment, id) => (
            <section className='sheet page-break' key={id}>
              {/* Bagian Atas - 325px */}
              <div style={{ height: 325 }}>
                <div
                  style={{ paddingTop: 10, paddingLeft: 10, paddingRight: 10 }}
                >
                  <table className='body border'>
                    <tr className='border'>
                      <td width={"35%"}>
                        <img
                          src={companyLogo}
                          alt=''
                          style={{ maxHeight: 25, padding: 5 }}
                        />
                      </td>
                      <td
                        colSpan={2}
                        valign='middle'
                        style={{
                          textAlign: "right",
                          paddingRight: 10,
                          paddingTop: 5,
                        }}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: getBarcodeSVG(shipment.shipment_number, {
                              scale: 2,
                              height: 10,
                              barwidth: 1.5,
                              textsize: 10,
                            }),
                          }}
                        />
                      </td>
                    </tr>

                    <tr className='border'>
                      <td className='border center' width={"61%"} colSpan={2}>
                        <div className='bold elips' style={{ fontSize: 14 }}>
                          {order.order_type}
                        </div>
                      </td>
                      <td className='border center bold'>
                        <div className='bold' style={{ fontSize: 12 }}>
                          {shipment.price > 0
                            ? `Rp ${currencyFormat(shipment.price)}`
                            : "-"}
                        </div>
                      </td>
                    </tr>

                    <tr className='border'>
                      <td
                        className='border'
                        colSpan={2}
                        rowSpan={2}
                        valign='top'
                      >
                        <div style={{ height: 50 }}>
                          <div
                            style={{ fontSize: 9, textTransform: "capitalize" }}
                          >
                            <b>Pengirim:</b> {shipment.origin_contact_name},{" "}
                            <b>Telp:</b> {shipment.origin_contact_phone}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              textTransform: "uppercase",
                              marginTop: 3,
                              maxLines: 2,
                              textOverflow: "ellipsis",
                              wordWrap: "break-word",
                            }}
                          >
                            {shipment.origin_address}
                          </div>
                        </div>
                      </td>
                      <td className='border left bold'>
                        <div
                          className='bold'
                          style={{ fontSize: 10, textTransform: "uppercase" }}
                        >
                          Ref: {shipment.reference_code || order.reference_code || "-"}
                        </div>
                      </td>
                    </tr>

                    <tr className='border'>
                      <td className='border center' rowSpan={2}>
                        <div className='bold' style={{ fontSize: 16 }}>
                          {shipment.dest_location_name || "-"}
                        </div>
                      </td>
                    </tr>

                    <tr className='border' style={{ height: "40px" }}>
                      <td className='border' colSpan={2} valign='top'>
                        <div style={{ height: 60 }}>
                          <div
                            style={{ fontSize: 9, textTransform: "capitalize" }}
                          >
                            <b>Penerima:</b> {shipment.dest_contact_name},{" "}
                            <b>Telp:</b> {shipment.dest_contact_phone}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              textTransform: "uppercase",
                              marginTop: 3,
                              maxLines: 2,
                              textOverflow: "ellipsis",
                              wordWrap: "break-word",
                            }}
                          >
                            {shipment.dest_address}
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className='border'>
                      <td className='border center'>
                        <QRCode
                          style={{
                            height: "65",
                            maxWidth: "100%",
                            width: "100%",
                          }}
                          bgColor='#fff'
                          fgColor='#000'
                          value={shipment?.shipment_number}
                        />
                      </td>

                      <td className='border' valign='top'>
                        <div style={{ fontSize: 10 }}>
                          <b>Deskripsi:</b>
                        </div>
                        {shipment.items?.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 10,
                              textTransform: "uppercase",
                              marginTop: 3,
                            }}
                          >
                            {item.name} ({item.quantity}x)
                          </div>
                        ))}
                      </td>

                      <td className='border' valign='top'>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Tanggal:{" "}
                          {dateFormat(
                            shipment.scheduled_pickup_date,
                            "DD/MM/YYYY",
                          )}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Kota Asal: {shipment.origin_location_name}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Berat: {shipment.total_weight || 0} Kg
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Jumlah Koli:{" "}
                          {shipment.items?.reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0,
                          ) || 0}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Jenis: {order.order_type}
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              {/* Bagian Bawah - 151px */}
              <div style={{ height: 151 }}>
                <div
                  style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingBottom: 10,
                  }}
                >
                  <table className='body border'>
                    <tr className='border'>
                      <td
                        className='border'
                        colSpan={2}
                        align='center'
                        valign='middle'
                        style={{ paddingTop: 5 }}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: getBarcodeSVG(shipment.shipment_number, {
                              scale: 2,
                              height: 8,
                              barwidth: 1,
                              textsize: 9,
                            }),
                          }}
                        />
                      </td>
                      <td
                        className='border center'
                        width={"39%"}
                        valign='middle'
                      >
                        <div
                          className='bold center elips'
                          style={{ fontSize: 14 }}
                        >
                          {order.order_type}
                        </div>
                      </td>
                    </tr>

                    <tr className='border'>
                      <td
                        className='border center'
                        style={{ height: 60 }}
                        valign='middle'
                        width='20%'
                      >
                        <img
                          src={companyLogo}
                          alt=''
                          style={{ maxHeight: 18, padding: 5 }}
                        />
                      </td>

                      <td
                        className='border'
                        style={{ maxHeight: 60 }}
                        valign='top'
                      >
                        <div style={{ fontSize: 9 }}>
                          Ref: {order.reference_code || "-"}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Tanggal:{" "}
                          {dateFormat(
                            shipment.scheduled_pickup_date,
                            "DD/MM/YYYY",
                          )}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Kota Asal: {shipment.origin_location_name}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Berat: {shipment.total_weight || 0} Kg
                        </div>
                        <div style={{ fontSize: 9, marginTop: 3 }}>
                          Jumlah Koli:{" "}
                          {shipment.items?.reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0,
                          ) || 0}
                        </div>
                      </td>

                      <td className='border' width={"39%"} valign='top'>
                        <div style={{ fontSize: 10, marginBottom: 10 }}>
                          <b>Pengirim:</b> {shipment.origin_contact_name},{" "}
                          <b>Telp:</b> {shipment.origin_contact_phone}
                        </div>
                        <div style={{ fontSize: 10 }}>
                          <b>Penerima:</b> {shipment.dest_contact_name},{" "}
                          <b>Telp:</b> {shipment.dest_contact_phone}
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </section>
          )),
        )}
      />
    </div>
  );
};

export default PrintResiOrderScreen;
