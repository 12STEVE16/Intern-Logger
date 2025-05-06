// src/react-calendar-heatmap.d.ts
declare module "react-calendar-heatmap" {
  import * as React from "react";
  interface CalendarValue {
    date: string;
    count: number;
  }
  interface Props {
    startDate: string | Date;
    endDate: string | Date;
    values: CalendarValue[];
    showWeekdayLabels?: boolean;
    tooltipDataAttrs?: (value: CalendarValue) => {
      [attr: string]: string | undefined;
    };
    classForValue?: (value: CalendarValue) => string;
  }
  const CalendarHeatmap: React.FC<Props>;
  export default CalendarHeatmap;
}
