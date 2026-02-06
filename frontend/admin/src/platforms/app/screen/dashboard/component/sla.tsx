import ReactApexChart from "react-apexcharts";
import { type ApexOptions } from "apexcharts";

const Sla = () => {
  const options: ApexOptions = {
    chart: {
      height: 5,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        distributed: false,
      },
    },
    colors: ["#059669"],
    grid: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    xaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false, // 🔥 hilangkan garis utama bawah
      },
      axisTicks: {
        show: false, // 🔥 hilangkan "tick" kecil
      },
    },
  };

  const series = [
    {
      data: [21, 22, 10, 28, 16, 21, 13, 30],
    },
  ];

  return (
    <ReactApexChart options={options} series={series} type="bar" height={150} />
  );
};

export default Sla;
