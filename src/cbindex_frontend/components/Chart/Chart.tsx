import React, {useRef, useEffect} from "react";
import * as LightweightCharts from "lightweight-charts";
import classes from './style.module.less'
import changeSize from "../../utils/changeSize/changeSize";
let series: any
let firstChart: any = null
const Chart = ({ lineData }: any) => {
  let width = changeSize()?.width
  const chart = useRef(null) as any
  useEffect(() => {
    createChartDom()
  }, [])
  useEffect(() => {
    if (lineData.length) {
      series.setData(lineData);
    }
  }, [lineData])
  const createChartDom = () => {
    firstChart = LightweightCharts.createChart(chart.current as any, {
      layout: {
        background: {
          color: "transparent",
        },
        textColor: "#555555",
      },
      grid: {
        horzLines: {
          color: "transparent",
        },
        vertLines: {
          color: "transparent",
        },
      },
      crosshair: {
        vertLine: {
          color: "#555555",
          labelVisible: true,
          labelBackgroundColor: "#50f6bf",
        },
        horzLine: {
          color: "#555555",
          labelVisible: true,
          labelBackgroundColor: "#50f6bf",
        },
      },
      watermark: {
        visible: true,
        color: "#2c3333",
        text: "CBIndex DApp",
        fontStyle: "bold",
      },
      localization: {
        dateFormat: "dd MMMM, yyyy",
      },
    });
    series = firstChart.addLineSeries({
      color: "#50F6BF",
      lineWidth: 2,
      lineType: LightweightCharts.LineType.Simple,
    });
  }
  useEffect(() => {
    if (firstChart) {
      firstChart.resize(chart.current.offsetWidth, 500)
    }
  }, [width])
  return <>
    <div ref={chart} className={classes.chartBox}>
    </div>
  </>
}
export default Chart