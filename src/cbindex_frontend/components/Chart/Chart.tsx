import React, { useRef, useEffect, useImperativeHandle } from "react";
import * as LightweightCharts from "lightweight-charts";
import classes from './style.module.less'
import changeSize from "../../utils/changeSize/changeSize";
import { Spin } from 'antd'
let firstChart: any = null;
/**
 * 功能:
 * 1.鼠标移动离开监听 -
 * 2.线的颜色更换。-
 * 3.语言的切换。-
 * 4.显示,隐藏,删除某条线 -
 * 5.触碰小卡片的显示。
 * 6.缩放线图后复原线图。-
 * 7.加载状态。-
 * 8.不同线的显示方式。
 * 9.线支持在不同的Y轴上显示。
 * 10.可以同时比较多条线。- 
 */
/**
 * updateChartLine：添加,更新,删除,显示,隐藏,重新填充
 * setLineStyleByIdFuc：设置某条线的颜色,大小
 */
const Chart = ({ onMove = () => { }, onLeave = () => { }, chartChildRef, getLineArrayFuc, loading = false }: any) => {
  let width = changeSize()?.width
  const chart = useRef(null) as any
  const lineObjMap = useRef({})

  /**utils */
  const addLineFuc = ({ id, data, options }) => {
    let lineObj = {
      instance: "",
      lineWidth: 2,
      visible: true,
      addLineShowType: "addLineSeries", //1.addAreaSeries 2.addLineSeries
      lineType: 0,  // 线的类型:线的连接方式
      color: "#5bfb91", // 颜色:线条颜色。
      updateType: "add"
    }
    /**有额外的配置 */
    if (options) {
      lineObj = { ...lineObj, ...options }
    }
    if (lineObj.addLineShowType === "addLineSeries") {
      let line = firstChart.addLineSeries(lineObj)
      line.setData(data)
      lineObj.instance = line
      lineObjMap.current[id] = lineObj
    } else {
      let line = firstChart.addAreaSeries(lineObj)
      line.setData(data)
      lineObj.instance = line
      lineObjMap.current[id] = lineObj
    }
  }

  const deleteByIdFuc = (id) => {
    firstChart.removeSeries(lineObjMap.current[id].instance)
    delete lineObjMap.current[id]
  }

  const hideByIdFuc = (id) => {
    lineObjMap.current[id].instance.applyOptions({
      visible: !lineObjMap.current[id].visible
    })
    lineObjMap.current[id].visible = !lineObjMap.current[id].visible
  }

  const chartFitContentFuc = () => {
    firstChart.timeScale().fitContent()
  }
  const setColorByIdFuc = (id, changeValue) => {
    lineObjMap.current[id].visible = !lineObjMap.current[id].visible
    lineObjMap.current[id].instance.applyOptions({
      color: changeValue
    })
  }

  /**Action Fuc */
  const updateChartLine = ({ updateType, data, id }, options) => {
    switch (updateType) {
      case "add":
        addLineFuc({ id, data, options })
        break
      case "updateLineData":

        break
      case "hide":
        hideByIdFuc(id)
        break
      case "delete":
        deleteByIdFuc(id)
        break
      case "fitContent":
        chartFitContentFuc()
        break
      default:
        throw new Error("updateType:Type Error")
    }
    getLineArrayFuc(lineObjMap.current)
    return "Success"
  }

  const setLineStyleByIdFuc = (id, { type, changeValue }) => {
    switch (type) {
      case "setColor":
        setColorByIdFuc(id, changeValue)
        break
    }
    getLineArrayFuc(lineObjMap.current)
  }

  /**init Dom */
  useEffect(() => {
    createChartDom()
  }, [])

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
        locale: "en"
      },
    });
    firstChart.subscribeCrosshairMove(function (param) {
      if (param.time) {
        onMove(param)
      } else {
        onLeave(param)
      }
    })
  }

  useEffect(() => {
    if (firstChart) {
      firstChart.resize(chart.current.offsetWidth, 500)
    }
  }, [width])

  useImperativeHandle(chartChildRef, () => {
    return {
      updateChartLine,
      setLineStyleByIdFuc
    }
  })

  return <>
    <Spin spinning={loading} >
      <div ref={chart} className={classes.chartBox}>
      </div>
    </Spin>
  </>
}
export default Chart