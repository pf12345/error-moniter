import Vue from "vue";
import App from './App';
import debug from './../debug.js';

debug.init();

/* eslint-disable no-new */
new Vue({
  el: 'body',
  components: { App }
})

