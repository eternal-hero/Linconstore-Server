export const getTimeDiff  = (date : Date) : number => {
        const now = new Date();
        const oldDate : Date = new Date(date);
        // @ts-ignore
        return Math.floor(Math.abs(now  - oldDate ) / 36e5)
}

export const reCreateDate = (date : Date | string) : string => {
        return  new Date(date).toLocaleString('default', {month: 'short', year: 'numeric', day: '2-digit'})
}
export  const checkIfDateIsExpired = (date : Date) : boolean => {
        const now = new Date();
        const endDate : Date = new Date(date);
        return  endDate > now
        // return Math.floor(Math.abs(    now - oldDate )   / 36e5)
}

export const getDateRange  = (type: string): string => {
        let futureDays : number;
        let additionalDays : number;
        if (type === 'Express'){
                futureDays = 1;
                additionalDays = 5
        }else{
                futureDays = 8;
                additionalDays=16
        }
        const start = new Date();
        const end = new Date();
        start.setDate(start.getDate() + futureDays);
        end.setDate(end.getDate() + additionalDays);

        const startDateString = start.getDate();
        const endDateString = end.getDate();
        const startMonthString = start.toLocaleString('default', { month: 'long' });
        const yearString = start.getFullYear();


        return `${startDateString} - ${endDateString} ${startMonthString}, ${yearString}`;
}

export const getLastweek = (number : number) => {
        let today = new Date();
        let lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - number);
        let lastWeekMonth = lastWeek.getMonth() + 1;
        let lastWeekDay = lastWeek.getDate();
        let lastWeekYear = lastWeek.getFullYear();
        let lastWeekDisplay = lastWeekMonth + "/" + lastWeekDay + "/" + lastWeekYear;
        return new Date(lastWeekDisplay);
}

export const isBeforeToday = (date : Date) => {
        return new Date(date.toDateString()) < new Date(new Date().toDateString());
}

export const getFormattedDate = (): string => {
        const today = new Date();
        const options : any = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateFormatter = new Intl.DateTimeFormat('en-US', options);
        const formattedDate = dateFormatter.format(today);

        return formattedDate;
};

export const  getMonthStartDates = ()  : Date[] => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const startDates: Date[] = [];
      
        for (let month = 0; month <= currentDate.getMonth(); month++) {
          const startDate = new Date(currentYear, month, 1);
          startDates.push(startDate);
        }
      
        // Add start of next month if not in December
        if (currentDate.getMonth() !== 11) {
          const nextMonthStartDate = new Date(currentYear, currentDate.getMonth() + 1, 1);
          startDates.push(nextMonthStartDate);
        }
      
        return startDates;
      
}

export const roundUpNumber = (num: number): number  =>{
        const roundedNum = Math.ceil(num / 1000) * 1000;
        return roundedNum;
      }
      