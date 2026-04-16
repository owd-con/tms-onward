/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const Print = ({
  size,
  content,
  title,
}: {
  size?: string;
  content: any;
  title?: string;
}) => {
  const renderedRef = React.useRef(false);

  const stylesHtml = `
  html {
    line-height: 1;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%
  }
  body {
    font-family: 'Inter', sans-serif  !important;
    margin:0;
    font-size: 90%;
  }
  article, aside, footer, header, nav, section {
    display: block
  }
  img {
    border-style: none
  }
  template {
    display: none
  }
  [hidden] {
    display: none
  }
  @page {
    margin: 0
  }
  .sheet {
    margin: 0 auto;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
    page-break-after: always;
  }

  body.RESI .sheet {
    width:102mm;
    height:127mm;
  }
  body.REG .sheet {
    width:80mm;
    height:40mm;
    padding: 0;
    overflow: hide;
  }
  body.LABELPACK .sheet {
    width:100mm;
    height:100mm
  }
  body.LABELPROD .sheet {
    width:108mm;
    height:15mm
  }
  body.A3 .sheet {
    width: 297mm;
    height: 419mm
  }
  body.A3.landscape .sheet {
    width: 420mm;
    height: 296mm
  }
  body.A4 .sheet {
    width: 210mm;
    height: 296mm;
  }
  body.A4.landscape .sheet {
    width: 297mm;
    height: 209mm;
  }
  body.A5 .sheet {
    width: 148mm;
    height: 209mm;
  }

  body.A5.landscape .sheet {
    width: 210mm;
    height: 147mm;
  }
  .sheet.padding-10mm {
    padding: 10mm
  }
  .sheet.padding-15mm {
    padding: 15mm
  }
  .sheet.padding-20mm {
    padding: 20mm
  }
  .sheet.padding-25mm {
    padding: 25mm
  }
  @media screen {
    body {
      background: #0e0e0e
    }
    .sheet {
      background: #fff;
      box-shadow: 0 .5mm 2mm rgba(0, 0, 0, .3);
      margin: 5mm auto;
    }
  }
  @media print {
    html, body {
        height: 99% !important;
    }
    body.A3.landscape {
      width: 420mm
    }
    body.RESI {
      width:102mm;
      height:127mm
    }
    body.A3, body.A4.landscape {
      width: 297mm
    }
    body.A4, body.A5.landscape {
      width: 210mm
    }
    body.A5 {
      width: 148mm
    }
  }
  @media print {
    .page-break {
      page-break-after: always
    }
    @page {
      padding-right: 0px
    }
  }
  table {
    width: 100%;
    padding: 0;
    border-collapse: collapse;
  }
  table th,table td {
    font-weight: normal !important;
    font-family: 'Inter', sans-serif;
  }
  p {
    word-wrap: break-word;
    margin-block-start: 0px !important;
    font-size: 11px;
  }
  .mb-0 {
    margin-block-end: 3px !important;
  }
  h1, h2, h3, h4, h5 {
    margin-block-start: 0px !important;
    margin-block-end: 10px !important;
  }

  h2 {
    font-size: 16px;
  }

  .uppercase {
    text-transform: uppercase !important;
  }
  .bold {
    font-weight: 600;
  }
  .elips {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
  }

  table.bordered, th.bordered, td.bordered {
    border: .5px solid #ddd;
    border-collapse: collapse;
    padding: 5px;
  }

   table.border, th.border, td.border {
    border: 1px solid #202020;
    border-collapse: collapse;
    padding: 5px;
  }

  .d-flex {
    display: flex;
  }

  .flex-column {
    flex-direction: column;
  }

  .flex-row {
    flex-direction: row;
  }

  .align-items-center {
    align-items: center;
  }

  .justify-content-between {
    justify-content: space-between;
  }

  .justify-content-around {
    justify-content: space-around;
  }

  .justify-content-center {
    justify-content: center;
  }

  .border-top {
    border-top: .5px solid #ddd
  }
  .border-left {
    border-left: .5px solid #ddd
  }
  .border-right {
    border-right: .5px solid #ddd
  }
  .border-bottom {
    border-bottom: .5px solid #ddd;
  }
  table.body th {
    border-bottom: .5px solid #ddd;
    text-align: left
  }
  table.header {
    width: 100%
  }
  td.center, th.center {
    text-align: center
  }
  td.right, th.right {
    text-align: right !important
  }
  td.left, th.left {
    text-align: left !important
  }
  th.center {
    text-align: center !important
  }
  td.padding {
    padding: 4px 10px;
  }
  .text-center {
    text-align: center
  }
  .logo {
    position: absolute;
    top: 10px;
    right: 0;
    margin-right: 25px;
    margin-top: 25px;
  }
  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    margin-top: auto;
    text-align: right
  }
  .bg-light {
    background-color: rgba(42, 118, 167, 0.3);
  }
  .table-col .fs-8 {
	 font-size: 11px !important;
  }
  .table-col small {
    font-size: 10px;
    letter-spacing: 0.5px;
  }
  .table-col small.info {
    display: block;
  }
  .fw-semibold {
    font-weight: 600 !important;
  }
  .text-capitalize {
    text-transform: capitalize !important;
  }
  .text-white {
    color: #fff
  }
  .tb-spacing {
    padding-top: 15px;
    padding-bottom: 15px;
    padding-left: 5px;
    padding-right: 5px;
  }
  canvas {
    margin: 0 auto;
    display: block;
  }

  `;

  const render = () => {
    document.write(
      `<!DOCTYPE html><html><head><link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet"><style>${stylesHtml}</style><title>${title}</title></head><body class="${size}">${content}</body></html>`,
    );
  };

  React.useEffect(() => {
    if (renderedRef.current) return;
    renderedRef.current = true;

    render();

    // setTimeout(function () {
    //   window.focus();
    //   window.print();

    //   setTimeout(function () {
    //     window.close();
    //   }, 100);
    // }, 500);
  }, []);

  return null;
};

export default Print;
