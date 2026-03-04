import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import { Button, Input, Select } from "../../ui";
import type { DatePickerProps } from "./types";
import { IoCalendarOutline } from "react-icons/io5";

export const DatePicker = memo(
  ({
    mode = "single",
    pickerMode = "date",
    value,
    onChange,
    placeholder = "Select date",
    format = "YYYY-MM-DD",
    disablePast = false,
    inputClassName,
    className,
    label,
    suffix,
    error,
    required,
    disabled = false,
  }: DatePickerProps) => {
    const isRange = mode === "range";
    const isYearPicker = pickerMode === "year";

    const [internalValue, setInternalValue] = useState<
      Dayjs | [Dayjs | null, Dayjs | null] | null
    >(value || null);

    const [viewMonths, setViewMonths] = useState<[Dayjs, Dayjs]>(() => [
      dayjs().startOf("month"),
      dayjs().add(1, "month").startOf("month"),
    ]);

    // For year picker: store the current decade being viewed
    const [viewDecade, setViewDecade] = useState<Dayjs>(() => {
      const selectedYear = internalValue
        ? dayjs(internalValue as Dayjs).year()
        : dayjs().year();
      // Center the decade on the selected year or current year
      const decadeStart = Math.floor(selectedYear / 10) * 10;
      return dayjs().year(decadeStart);
    });

    const [show, setShow] = useState(false);
    const [hoverDate, setHoverDate] = useState<Dayjs | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const daysInMonthGrid = useCallback((month: Dayjs) => {
      const start = month.startOf("month").startOf("week");
      const end = month.endOf("month").endOf("week");
      const days: Dayjs[] = [];
      let day = start;
      while (day.isBefore(end) || day.isSame(end, "day")) {
        days.push(day);
        day = day.add(1, "day");
      }
      return days;
    }, []);

    useEffect(() => {
      setInternalValue(value || null);
    }, [value]);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setShow(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
      if (!show) {
        setHoverDate(null);
        if (isRange) {
          const [start, end] = (internalValue as [
            Dayjs | null,
            Dayjs | null,
          ]) || [null, null];
          if (start && !end) {
            setInternalValue(null);
            onChange?.(null);
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const handleSelectDate = useCallback(
      (date: Dayjs) => {
        if (isRange) {
          const [start, end] = (internalValue as [
            Dayjs | null,
            Dayjs | null,
          ]) || [null, null];
          if (!start || (start && end)) {
            setInternalValue([date, null]);
            onChange?.([date, null]);
          } else if (start && !end) {
            const newRange: [Dayjs, Dayjs] = date.isBefore(start)
              ? [date, start]
              : [start, date];
            setInternalValue(newRange);
            onChange?.(newRange);
            setShow(false);
          }
        } else {
          setInternalValue(date);
          onChange?.(date);
          setShow(false);
        }
      },
      [isRange, internalValue, onChange],
    );

    const handleSelectYear = useCallback(
      (yearValue: string) => {
        const year = parseInt(yearValue, 10);
        const date = dayjs().year(year).startOf("year");

        if (isRange) {
          setInternalValue([date, null]);
          onChange?.([date, null]);
        } else {
          setInternalValue(date);
          onChange?.(date);
          setShow(false);
        }
      },
      [isRange, onChange],
    );

    // Year picker navigation handlers
    const handlePreviousDecade = useCallback(() => {
      setViewDecade((prev) => prev.subtract(10, "year"));
    }, []);

    const handleNextDecade = useCallback(() => {
      setViewDecade((prev) => prev.add(10, "year"));
    }, []);

    const currentYear = dayjs().year();

    // Generate 10 years for the current decade view
    const decadeYears = useMemo(() => {
      const decadeStart = viewDecade.year();

      const years: { label: string; value: string; disabled?: boolean }[] = [];
      for (let y = decadeStart; y < decadeStart + 10; y++) {
        years.push({
          label: y.toString(),
          value: y.toString(),
        });
      }
      return years;
    }, [viewDecade.year()]);

    const handleSelectToday = useCallback(() => {
      const today = dayjs();
      if (isRange) {
        setInternalValue([today, null]);
        onChange?.([today, null]);
      } else {
        setInternalValue(today);
        onChange?.(today);
        setShow(false);
      }
    }, [isRange, onChange]);

    const months = useMemo(
      () => [
        { label: "January", value: "1" },
        { label: "February", value: "2" },
        { label: "March", value: "3" },
        { label: "April", value: "4" },
        { label: "May", value: "5" },
        { label: "June", value: "6" },
        { label: "July", value: "7" },
        { label: "August", value: "8" },
        { label: "September", value: "9" },
        { label: "October", value: "10" },
        { label: "November", value: "11" },
        { label: "December", value: "12" },
      ],
      [],
    );

    const currentMonth = dayjs().month() + 1;

    const years = useMemo(() => {
      const years: { label: string; value: string }[] = [];
      const minY = disablePast ? currentYear : currentYear - 50;
      const maxY = currentYear + 20;
      for (let y = minY; y <= maxY; y++) {
        years.push({ label: y.toString(), value: y.toString() });
      }
      return years;
    }, [currentYear, disablePast]);

    const leftMonth = viewMonths[0].month() + 1;
    const leftYear = viewMonths[0].year();
    const rightYear = viewMonths[1].year();

    // bulan kanan
    const monthsRight = months.filter((m) => {
      if (rightYear === leftYear) {
        return Number(m.value) >= leftMonth;
      }
      if (disablePast && rightYear === currentYear) {
        return Number(m.value) >= currentMonth;
      }
      return true;
    });

    // bulan kiri → tambahin filter (ini yang kurang kemarin)
    const monthsLeft = months.filter((m) => {
      if (disablePast && leftYear === currentYear) {
        return Number(m.value) >= currentMonth;
      }
      return true;
    });

    const yearsRight = years.filter((y) => Number(y.value) >= leftYear);

    const onChangeMonthLeft = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const monthNumber = Number(e.target.value);
        setViewMonths((prev) => {
          let newRightMonth = prev[1].month() + 1;
          const newLeftYear = prev[0].year();

          if (newLeftYear === prev[1].year() && monthNumber > newRightMonth) {
            newRightMonth = monthNumber;
          }

          return [
            prev[0].month(monthNumber - 1),
            prev[1].month(newRightMonth - 1).year(prev[1].year()),
          ];
        });
      },
      [],
    );

    const onChangeYearLeft = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const yearNumber = Number(e.target.value);
        setViewMonths((prev) => {
          let newRightYear = prev[1].year();
          let newRightMonth = prev[1].month() + 1;

          if (yearNumber > prev[1].year()) {
            newRightYear = yearNumber;
            newRightMonth = 1;
          }

          if (
            yearNumber === newRightYear &&
            newRightMonth < prev[0].month() + 1
          ) {
            newRightMonth = prev[0].month() + 1;
          }

          return [
            prev[0].year(yearNumber),
            prev[1].year(newRightYear).month(newRightMonth - 1),
          ];
        });
      },
      [],
    );

    const onChangeMonthRight = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const monthNumber = Number(e.target.value);
        setViewMonths((prev) => {
          const leftYear = prev[0].year();
          const leftMonth = prev[0].month() + 1;
          const rightYear = prev[1].year();

          let newMonth = monthNumber;
          if (rightYear === leftYear && newMonth < leftMonth) {
            newMonth = leftMonth;
          }

          return [prev[0], prev[1].month(newMonth - 1)];
        });
      },
      [],
    );

    const onChangeYearRight = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const yearNumber = Number(e.target.value);
        setViewMonths((prev) => {
          const leftYear = prev[0].year();

          const newYear = yearNumber < leftYear ? leftYear : yearNumber;
          let newMonth = prev[1].month() + 1;

          if (newYear === leftYear && newMonth < prev[0].month() + 1) {
            newMonth = prev[0].month() + 1;
          }

          return [prev[0], prev[1].year(newYear).month(newMonth - 1)];
        });
      },
      [],
    );

    const monthsToRender = useMemo(
      () => (isRange ? viewMonths : [viewMonths[0]]),
      [isRange, viewMonths],
    );

    const displayValue = () => {
      if (!internalValue) return "";
      if (isRange) {
        const [start, end] = (internalValue as [
          Dayjs | null,
          Dayjs | null,
        ]) || [null, null];
        return `${start ? start.format(format) : ""}${
          end ? ` - ${end.format(format)}` : ""
        }`;
      }
      return (internalValue as Dayjs).format(format);
    };

    const handleClear = useCallback(() => {
      setInternalValue(null);
      onChange?.(null);
      setShow(false);
    }, [onChange]);

    return (
      <div
        ref={ref}
        className={clsx(
          className,
          "w-full relative",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <Input
          required={required}
          label={label}
          readOnly
          value={displayValue()}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) setShow(true);
          }}
          prefix={
            <IoCalendarOutline
              className='h-5 w-5 text-base-content'
              onClick={() => {
                handleSelectToday();
              }}
              title="Set today's date"
            />
          }
          suffix={
            internalValue && !disabled ? (
              <Button
                onClick={() => {
                  setInternalValue(null);
                  onChange?.(null);
                }}
                variant='error'
                shape='circle'
                size='xs'
                styleType='soft'
                className='text-error hover:text-base-100'
                onMouseDown={(e) => e.preventDefault()}
              >
                &times;
              </Button>
            ) : (
              suffix
            )
          }
          className={clsx("flex-1", inputClassName)}
          error={error}
          disabled={disabled}
        />

        {show && !disabled && (
          <div
            className={clsx(
              "absolute z-50 p-4 bg-base-100 border border-base-200 rounded shadow-lg w-max top-full mt-2",
              isRange && "right-0",
            )}
          >
            {isYearPicker ? (
              // Year Picker Mode - Show decade navigation + year grid
              <div className='w-64'>
                {/* Decade Navigation Header */}
                <div className='flex justify-between items-center mb-3'>
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost hover:btn-primary'
                    onClick={handlePreviousDecade}
                  >
                    ‹
                  </button>
                  <span className='text-sm font-semibold'>
                    {viewDecade.year()} - {viewDecade.year() + 9}
                  </span>
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost hover:btn-primary'
                    onClick={handleNextDecade}
                  >
                    ›
                  </button>
                </div>

                {/* Year Grid */}
                <div className='grid grid-cols-4 gap-2'>
                  {decadeYears.map((year) => {
                    const isSelected = internalValue
                      ? dayjs(internalValue as Dayjs)
                          .year()
                          .toString() === year.value
                      : false;

                    return (
                      <button
                        key={year.value}
                        type='button'
                        className={clsx(
                          "btn btn-sm",
                          isSelected
                            ? "btn-primary"
                            : "btn-ghost hover:btn-primary",
                        )}
                        onClick={() => handleSelectYear(year.value)}
                      >
                        {year.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Date Picker Mode - Show full calendar
              <div className='flex gap-6'>
                {monthsToRender.map((month, idx) => {
                  const days = daysInMonthGrid(month);

                  let start: Dayjs | null = null;
                  let end: Dayjs | null = null;
                  if (isRange) {
                    const selectedRange = (internalValue as [
                      Dayjs | null,
                      Dayjs | null,
                    ]) || [null, null];
                    [start, end] = selectedRange;
                  }

                  const isLeft = idx === 0;

                  const monthOptions = isLeft ? monthsLeft : monthsRight;
                  const yearOptions = isLeft ? years : yearsRight;

                  const onChangeMonthHandler = isLeft
                    ? onChangeMonthLeft
                    : onChangeMonthRight;
                  const onChangeYearHandler = isLeft
                    ? onChangeYearLeft
                    : onChangeYearRight;

                  return (
                    <div key={idx} className='calendar-month min-w-62.5'>
                      <div className='flex justify-between items-center mb-2 gap-2'>
                        <Select
                          size='sm'
                          bordered
                          options={monthOptions}
                          value={String(month.month() + 1)}
                          onChange={onChangeMonthHandler}
                        />
                        <Select
                          size='sm'
                          bordered
                          options={yearOptions}
                          value={String(month.year())}
                          onChange={onChangeYearHandler}
                        />
                      </div>

                      <div className='grid grid-cols-7 text-center text-xs mb-1'>
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d} className='font-semibold'>
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className='grid grid-cols-7 text-center gap-1'>
                        {days.map((day, i) => {
                          const isCurrentMonth = day.isSame(month, "month");

                          const isDisabled =
                            disablePast && day.isBefore(dayjs(), "day");

                          let isSelected = false;
                          let isInRangeHover = false;

                          if (!isRange) {
                            isSelected = internalValue
                              ? day.isSame(internalValue as Dayjs, "day")
                              : false;
                          } else {
                            if (start && end) {
                              isSelected =
                                day.isSame(start, "day") ||
                                day.isSame(end, "day") ||
                                (day.isAfter(start, "day") &&
                                  day.isBefore(end, "day"));
                            } else if (start && !end) {
                              isSelected = day.isSame(start, "day");
                              if (hoverDate) {
                                const rangeStart = start.isBefore(hoverDate)
                                  ? start
                                  : hoverDate;
                                const rangeEnd = start.isAfter(hoverDate)
                                  ? start
                                  : hoverDate;

                                isInRangeHover =
                                  day.isAfter(rangeStart, "day") &&
                                  day.isBefore(rangeEnd, "day");
                              }
                            }
                          }

                          return (
                            <div
                              key={i}
                              className={clsx(
                                "btn btn-sm",
                                isDisabled
                                  ? "btn-ghost opacity-30 cursor-not-allowed pointer-events-auto"
                                  : "btn-ghost hover:btn-primary",
                                (isSelected || isInRangeHover) &&
                                  !isDisabled &&
                                  "btn-primary bg-primary text-base-100",
                              )}
                              onClick={() =>
                                !isDisabled && handleSelectDate(day)
                              }
                              onMouseEnter={() =>
                                !isDisabled && setHoverDate(day)
                              }
                              onMouseLeave={() =>
                                !isDisabled && setHoverDate(null)
                              }
                              style={{
                                opacity: isDisabled
                                  ? 0.3
                                  : isCurrentMonth
                                    ? undefined
                                    : 0.5,
                              }}
                            >
                              {day.date()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className='flex place-content-end gap-2 pt-2'>
              <div
                onClick={handleClear}
                className='btn btn-sm btn-error hover:btn-error-content text-base-100'
              >
                Clear
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";
