import ReactApexChart from "react-apexcharts";
import { type ApexOptions } from "apexcharts";

const Accuracy = () => {
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: 5,
      curve: "smooth",
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
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  const series = [
    {
      data: [21, 22, 10, 28, 16, 21, 13, 30],
    },
  ];

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="line"
      height={150}
    />
  );
};

export default Accuracy;
