import { HTMLElement, parse } from "node-html-parser";
import { CalendarDate, DayEvent } from "./types";

export class Calendar {
    private date: CalendarDate;

    constructor(date: CalendarDate | string, delimiter: string = "/") {
        this.date = this.parseDate(date, delimiter);
    }

    private parseDate(date: CalendarDate | string, delimiter: string = "/"): CalendarDate {
        if (typeof date === "string") {
            const split: string[] = date.split(delimiter);
            switch (split.length) {
                case 3:
                    return { year: +split[0], month: +split[1], day: +split[2] };
                case 2:
                    return { year: +split[0], month: +split[1] };
                default:
                    throw new Error("The date is not in the correct format.");
            }
        }
        return date;
    }

    private get makeUrl(): string {
        return `https://www.time.ir/fa/event/list/0/${this.date.year}/${this.date.month}/${this.date.day || ""}`;
    }

    private async fetch(): Promise<HTMLElement> {
        return parse(await fetch(this.makeUrl).then((res) => res.text()));
    }

    private p2e(str: string): string {
        return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
    }

    async isHoliday(): Promise<boolean> {
        if (this.date.day === undefined) {
            throw new Error("The day in the date must be specified.");
        }

        const body = await this.fetch();

        return body.querySelectorAll("ul[class=list-unstyled] > li").some((el) => el.getAttribute("class")?.trim() === "eventHoliday");
    }

    async events(): Promise<DayEvent[]> {
        const body = await this.fetch();

        return body.querySelectorAll("ul[class=list-unstyled] > li").map((el) => ({
            date: { ...this.date, day: this.date.day || +this.p2e(el.querySelector("span")?.text || "").replace(/\D/g, "") },
            description: el.childNodes[2].text.trim(),
            is_holiday: el.getAttribute("class")?.trim() === "eventHoliday",
        }));
    }
}
