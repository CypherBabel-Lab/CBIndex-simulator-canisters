export const localePriceNumber = (number: any) => {
    console.log(number);
    return Number(Number(number).toFixed(2)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}
export const localeAmountNumber = (number: any) => {
    console.log(number);
    return Number(Number(number).toFixed(6)).toLocaleString('en-US', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
    })
}