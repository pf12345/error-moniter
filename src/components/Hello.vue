<template>
  <div class="hello">
    <h1 v-demo="demo">hello {{ msg }} welcome here</h1>
    <!-- <h3 v-if="show" >this is v-if</h3> -->
  </div>
</template>

<script>
// import test from './test.vue'
export default {
  components: {
    // test
  },
  created() {
    setInterval(()=> {
      this.demo += 1;
    }, 1000)
      a
  },
  data () {
    return {
      msg: 'Hello World!',
      show: false,
      demo: 1
    }
  },
  directives: {
    demo: {
      bind: function() {
        this.el.setAttribute('style', 'color: green');
      },
      update: function(value) {
        if(value % 2) {
          this.el.setAttribute('style', 'color: green');
        } else {
          this.el.setAttribute('style', 'color: red');
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  color: #42b983;
}
</style>
