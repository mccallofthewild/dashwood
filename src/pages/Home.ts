import Vue from 'vue';
export const Home = Vue.extend({
	template: `
			<section role="steps--home" step="home" active>
				<div animated role="home--logo-container">
					<img role="home--logo" alt="logo image" />
				</div>
				<p role="slogan">The elegant way to pass down your fortune</p>
				<div animated style="margin-top: 20px">
					<button animated role="home--continue">Continue</button>
				</div>
				<!-- <animated-tree-vector height="50"></animated-tree-vector> -->
      </section> 
    `,
	mounted() {}
});
