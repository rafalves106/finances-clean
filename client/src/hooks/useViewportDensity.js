import { useEffect, useMemo, useState } from "react";

const getResponsiveDensity = (viewportTier) => {
  if (viewportTier === "xl") {
    return {
      dashboardGap: 16,
      mainPaddingTop: 16,
      mainPaddingBottom: 16,
      slideGap: 16,
      slideHeaderHeight: 60,
      slideBottomSafeArea: 88,
      slideInnerPadding: 12,
      sectionGap: 12,
      sectionThreeMaxHeight: 345,
      sectionThreeCardMinHeight: 260,
      chartMargin: { top: 8, right: 8, left: 8, bottom: 8 },
      chartTickFontSize: 10,
      chartYAxisWidth: 28,
    };
  }

  if (viewportTier === "lg") {
    return {
      dashboardGap: 12,
      mainPaddingTop: 12,
      mainPaddingBottom: 12,
      slideGap: 12,
      slideHeaderHeight: 56,
      slideBottomSafeArea: 64,
      slideInnerPadding: 10,
      sectionGap: 10,
      sectionThreeMaxHeight: 330,
      sectionThreeCardMinHeight: 244,
      chartMargin: { top: 6, right: 6, left: 4, bottom: 6 },
      chartTickFontSize: 10,
      chartYAxisWidth: 26,
    };
  }

  return {
    dashboardGap: 9,
    mainPaddingTop: 10,
    mainPaddingBottom: 10,
    slideGap: 9,
    slideHeaderHeight: 52,
    slideBottomSafeArea: 48,
    slideInnerPadding: 8,
    sectionGap: 8,
    sectionThreeMaxHeight: 305,
    sectionThreeCardMinHeight: 220,
    chartMargin: { top: 4, right: 4, left: 2, bottom: 4 },
    chartTickFontSize: 9,
    chartYAxisWidth: 24,
  };
};

export const useViewportDensity = ({ headerHeight }) => {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 900,
  );
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920,
  );

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const viewportTier =
    viewportWidth >= 1920 || viewportHeight >= 1080
      ? "xl"
      : viewportWidth >= 1440 || viewportHeight >= 900
        ? "lg"
        : "md";

  const responsiveDensity = useMemo(
    () => getResponsiveDensity(viewportTier),
    [viewportTier],
  );

  const {
    dashboardGap,
    mainPaddingTop,
    mainPaddingBottom,
    slideGap,
    slideHeaderHeight,
    slideBottomSafeArea,
    slideInnerPadding,
    sectionGap,
    sectionThreeMaxHeight,
    sectionThreeCardMinHeight,
    chartMargin,
    chartTickFontSize,
    chartYAxisWidth,
  } = responsiveDensity;

  const hUtil = Math.max(
    380,
    Math.floor(
      viewportHeight - headerHeight - mainPaddingTop - mainPaddingBottom,
    ),
  );
  const slideContentHeight = Math.max(
    220,
    hUtil - slideHeaderHeight - slideBottomSafeArea - slideGap,
  );
  const hConteudo = Math.max(220, hUtil - 2 * dashboardGap);
  const hSecao1 = Math.floor(hConteudo * 0.3);
  const hSecao2 = Math.floor(hConteudo * 0.28);
  const hSecao3Raw = hConteudo - hSecao1 - hSecao2;
  const hSecao3 = Math.min(hSecao3Raw, sectionThreeMaxHeight);

  const kpiTitleClassName =
    viewportTier === "xl"
      ? "text-[24px]"
      : viewportTier === "lg"
        ? "text-[22px]"
        : "text-[20px]";
  const kpiValueClassName =
    viewportTier === "xl"
      ? "text-2xl"
      : viewportTier === "lg"
        ? "text-[22px]"
        : "text-[20px]";
  const kpiHelperClampClassName =
    viewportTier === "xl" ? "" : "dashboard-kpi-helper-clamp";

  return {
    viewportTier,
    dashboardGap,
    mainPaddingTop,
    mainPaddingBottom,
    slideGap,
    slideHeaderHeight,
    slideBottomSafeArea,
    slideInnerPadding,
    sectionGap,
    sectionThreeMaxHeight,
    sectionThreeCardMinHeight,
    chartMargin,
    chartTickFontSize,
    chartYAxisWidth,
    hUtil,
    slideContentHeight,
    hConteudo,
    hSecao1,
    hSecao2,
    hSecao3,
    kpiTitleClassName,
    kpiValueClassName,
    kpiHelperClampClassName,
  };
};
