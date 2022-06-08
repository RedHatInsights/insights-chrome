/**
 * This is required for the segment analytics
 * It uses the unfetch library which is not compatbile with our fecth library and fails to initialize the
 * */
module.exports = window.fetch;
