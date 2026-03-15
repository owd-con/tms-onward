/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";

import { useOrder } from "@/services/order/hooks";
import type { Order, Shipment } from "@/services/types";

import Logo from "@/assets/logo_dark.svg";
import { dateFormat } from "@/utils/common";
import Print from "@/utils/print";

/**
 * TMS Onward - Print Order Screen
 *
 * Print order dengan layout A4, menampilkan daftar shipments
 * dengan pagination (firstPage: 10 items, subsequent: 15 items per page)
 */
const PrintOrderScreen = () => {
  const id = window.location.pathname.split("/").pop();
  const [data, setData] = useState<Order | null>(null);
  const [page, setPage] = useState<Shipment[][] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [firstPage] = useState(10);
  const [limit] = useState(15);

  const { show: showOrder, showResult: showOrderResult } = useOrder();

  const onLoad = () => {
    showOrder({ id: id as string });
  };

  useEffect(() => {
    if (!id) return;
    onLoad();
  }, [id]);

  useEffect(() => {
    if (showOrderResult?.isLoading || showOrderResult?.isFetching) return;
    const orderData = (showOrderResult?.data as any)?.data;
    setData(orderData);
  }, [showOrderResult]);

  useEffect(() => {
    if (data?.shipments) {
      // Chunk shipments for pagination
      let pages: (typeof data.shipments)[] = [];

      if (data.shipments.length > firstPage) {
        const first = data.shipments.slice(0, firstPage);
        const last = data.shipments.slice(firstPage);
        pages = [first];

        // Chunk remaining items with limit per page
        for (let i = 0; i < last.length; i += limit) {
          pages.push(last.slice(i, i + limit));
        }
      } else {
        pages = [data.shipments];
      }

      setPage(pages);
      setLoaded(true);
    }
  }, [data]);

  if (
    showOrderResult?.isLoading ||
    showOrderResult?.isFetching ||
    !data ||
    !loaded
  )
    return null;

  return (
    <div>
      {!data || data === null ? null : (
        <Print
          title={`Order - ${data?.order_number}`}
          size='A4'
          content={renderToString(
            page?.map((p, id) => (
              <section
                className='sheet page-break'
                key={id}
                style={{ padding: "20px 60px", position: "relative" }}
              >
                {id === 0 ? (
                  <>
                    <table
                      className='body'
                      style={{
                        borderBottom: `2px solid #2f83ba`,
                      }}
                    >
                      <tr style={{ verticalAlign: "center" }}>
                        <td
                          style={{
                            textAlign: "left",
                            paddingTop: 30,
                            width: "30%",
                          }}
                        >
                          <p
                            className='mb-0'
                            style={{ fontSize: 30, fontWeight: 800 }}
                          >
                            ORDER
                          </p>
                          <p
                            className='bold mb-0'
                            style={{ fontSize: 12, paddingTop: 10 }}
                          >
                            {data?.customer?.name || ""}
                          </p>
                          <p style={{ fontSize: 11, lineHeight: 1.5 }}>
                            {data?.customer?.address || ""}
                          </p>
                        </td>

                        <td style={{ width: "50%", textAlign: "right" }}>
                          <img src={Logo} alt='' height='50px' />
                        </td>
                      </tr>
                    </table>

                    <div
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <table className='body '>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              textAlign: "left",
                              width: "45%",
                              padding: 10,
                              paddingLeft: 0,
                            }}
                          >
                            <p className='bold' style={{ fontSize: 12 }}>
                              Customer:
                            </p>
                            <p
                              className='mb-0'
                              style={{
                                fontSize: 13,
                                lineHeight: 1.5,
                                marginBlockEnd: 0,
                              }}
                            >
                              {data?.customer?.name}
                            </p>
                            <p
                              className='mb-0'
                              style={{ fontSize: 11, lineHeight: 1.5 }}
                            >
                              {data?.customer?.phone || "-"}
                            </p>
                            <p
                              className=''
                              style={{ fontSize: 11, lineHeight: 1.5 }}
                            >
                              {data?.customer?.address || "-"}
                            </p>
                          </td>

                          <td
                            style={{
                              textAlign: "left",
                              width: "20%",
                            }}
                          ></td>
                          <td
                            style={{
                              textAlign: "left",
                              width: "35%",
                              padding: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <p className='bold mb-0' style={{ fontSize: 12 }}>
                                ORDER #
                              </p>
                              <p>{data?.order_number}</p>
                            </div>

                            {data?.reference_code && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                }}
                              >
                                <p
                                  className='bold mb-0'
                                  style={{ fontSize: 12 }}
                                >
                                  REFF #
                                </p>
                                <p>{data?.reference_code}</p>
                              </div>
                            )}

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <p className='bold mb-0' style={{ fontSize: 12 }}>
                                ORDER DATE
                              </p>
                              <p>
                                {dateFormat(data?.created_at, "DD/MM/YYYY")}
                              </p>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginTop: 5,
                              }}
                            >
                              <p className='bold mb-0' style={{ fontSize: 12 }}>
                                TYPE
                              </p>
                              <p>{data?.order_type}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </>
                ) : null}

                <div style={{ marginTop: 10 }} className=''>
                  <table className='bordered'>
                    <thead style={{ backgroundColor: "#2f83ba" }}>
                      <tr className='bordered'>
                        <td
                          className='center tb-spacing'
                          style={{
                            padding: 5,
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12 }}
                          >
                            No.
                          </p>
                        </td>
                        <td
                          className='left tb-spacing'
                          style={{
                            padding: 5,
                            width: "20%",
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12 }}
                          >
                            Kode Shipment
                          </p>
                        </td>
                        <td
                          className='left tb-spacing'
                          style={{
                            padding: 5,
                            width: "28%",
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12 }}
                          >
                            Origin
                          </p>
                        </td>
                        <td
                          className='left tb-spacing'
                          style={{
                            padding: 5,
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12, width: "28%" }}
                          >
                            Tujuan
                          </p>
                        </td>
                        <td
                          className='center tb-spacing'
                          style={{
                            padding: 5,
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12 }}
                          >
                            Berat (Kg)
                          </p>
                        </td>
                        <td
                          className='center tb-spacing'
                          style={{
                            padding: 5,
                          }}
                        >
                          <p
                            className='bold mb-0 text-white'
                            style={{ fontSize: 12 }}
                          >
                            Koli
                          </p>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      {p?.map((shipment, i) => (
                        <tr key={i} className='bordered'>
                          <td className='bordered center'>
                            <p className=' mb-0'>
                              {id > 1
                                ? limit + (firstPage * (id - 1) + i + 1)
                                : i + 1}
                            </p>
                          </td>
                          <td className='bordered left'>
                            <p className='bold mb-0'>
                              {shipment?.shipment_number}
                            </p>
                          </td>
                          <td className='bordered left'>
                            <p className='bold mb-0'>
                              {shipment?.origin_contact_name} -{" "}
                              {shipment?.origin_contact_phone}
                            </p>
                            <p className='mb-0'>
                              {shipment?.origin_location_name},{" "}
                              {shipment?.origin_address}
                            </p>
                          </td>
                          <td className='bordered left'>
                            <p className='bold mb-0'>
                              {shipment?.dest_contact_name} -{" "}
                              {shipment?.dest_contact_phone}
                            </p>
                            <p className='mb-0'>
                              {shipment?.dest_location_name},{" "}
                              {shipment?.dest_address}
                            </p>
                          </td>
                          <td className='bordered center'>
                            <p className=' mb-0'>
                              {shipment?.total_weight || 0}
                            </p>
                          </td>
                          <td className='bordered center'>
                            <p className=' mb-0'>
                              {shipment.items?.reduce(
                                (sum, item) => sum + (item.quantity || 0),
                                0,
                              ) || 0}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {page?.length === id + 1 && (
                  <div>
                    <table className='body bordered' style={{ marginTop: 20 }}>
                      <tr className='bordered'>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Shipper</p>
                        </td>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Driver</p>
                        </td>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Penerima / Recipient</p>
                        </td>
                      </tr>
                      <tr className='bordered'>
                        <td
                          className='bordered'
                          style={{ width: "33%", height: 80 }}
                        ></td>
                        <td
                          className='bordered'
                          style={{ width: "33%", height: 80 }}
                        ></td>
                        <td
                          className='bordered'
                          style={{ width: "33%", height: 80, padding: 0 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              flexDirection: "column",
                              alignItems: "stretch",
                              textAlign: "center",
                            }}
                          >
                            <p
                              className='bold'
                              style={{ marginBottom: 60, fontSize: 8 }}
                            >
                              Diterima dalam kondisi yang baik dan cukup
                            </p>
                            <p className='mb-0 bold' style={{ fontSize: 8 }}>
                              Nama / TTD / Stemple
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr className='bordered'>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Tanggal :</p>
                        </td>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Tanggal :</p>
                        </td>
                        <td className='bordered' style={{ width: "33%" }}>
                          <p className='bold mb-0'>Tanggal :</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                )}
              </section>
            )),
          )}
        />
      )}
    </div>
  );
};

export default PrintOrderScreen;
