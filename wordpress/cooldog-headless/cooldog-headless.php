<?php
/**
 * Plugin Name: Cool Dog Headless
 * Description: Connects this WordPress / WooCommerce site to the Next.js front end. Sends visitors to the new site, keeps cart / checkout / accounts here, and refreshes the front end when content changes. Settings → Cool Dog Headless.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Cool Dog Water Fountains
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const COOLDOG_HEADLESS_OPTION = 'cooldog_headless';

/** Saved settings: front-end URL, refresh secret, redirect on/off. */
function cooldog_headless_settings() {
	$saved = get_option( COOLDOG_HEADLESS_OPTION, array() );
	return wp_parse_args(
		is_array( $saved ) ? $saved : array(),
		array(
			'frontend_url' => '',
			'secret'       => '',
			'redirect'     => '0',
		)
	);
}

/** The Next.js site's address without a trailing slash, or '' if not set. */
function cooldog_headless_frontend() {
	$url = cooldog_headless_settings()['frontend_url'];
	return $url ? untrailingslashit( esc_url_raw( $url ) ) : '';
}

/* ------------------------------------------------------------------------- */
/* 1. Send visitors to the new site                                          */
/* ------------------------------------------------------------------------- */

add_action(
	'template_redirect',
	function () {
		$settings = cooldog_headless_settings();
		$frontend = cooldog_headless_frontend();
		if ( '1' !== $settings['redirect'] || ! $frontend ) {
			return;
		}
		// Things that must stay on WordPress.
		if (
			is_admin() || wp_doing_ajax() || wp_doing_cron() || is_preview() || is_feed()
			|| ( defined( 'REST_REQUEST' ) && REST_REQUEST )
			|| isset( $_GET['wc-api'] ) || isset( $_GET['add-to-cart'] ) || isset( $_GET['et_fb'] )
			|| current_user_can( 'edit_posts' ) // Editors keep the WordPress front end (Divi builder, previews).
		) {
			return;
		}
		if ( function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url() ) ) {
			return;
		}
		$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
		// The WordPress front page lives at "/" on the new site.
		$path = preg_replace( '#^/dog-water-fountains/?#', '/', $path );
		wp_redirect( $frontend . $path, 301, 'Cool Dog Headless' );
		exit;
	},
	1
);

/* ------------------------------------------------------------------------- */
/* 2. WooCommerce links point shoppers back to the new site                   */
/* ------------------------------------------------------------------------- */

/** Rewrite a WordPress URL to the same path on the new site. */
function cooldog_headless_to_frontend( $url ) {
	$frontend = cooldog_headless_frontend();
	if ( ! $frontend || ! is_string( $url ) ) {
		return $url;
	}
	$home = untrailingslashit( home_url() );
	return 0 === strpos( $url, $home ) ? $frontend . substr( $url, strlen( $home ) ) : $url;
}

add_filter(
	'woocommerce_return_to_shop_redirect',
	function ( $url ) {
		$frontend = cooldog_headless_frontend();
		return $frontend ? $frontend . '/shop/' : $url;
	}
);
add_filter(
	'woocommerce_continue_shopping_redirect',
	function ( $url ) {
		$frontend = cooldog_headless_frontend();
		return $frontend ? $frontend . '/shop/' : $url;
	}
);
// Product links in the cart, checkout, emails and account pages.
add_filter( 'woocommerce_cart_item_permalink', 'cooldog_headless_to_frontend' );
add_filter(
	'post_type_link',
	function ( $url, $post ) {
		return 'product' === $post->post_type && ! is_admin() ? cooldog_headless_to_frontend( $url ) : $url;
	},
	10,
	2
);

/* ------------------------------------------------------------------------- */
/* 3. Refresh the new site when content changes                               */
/* ------------------------------------------------------------------------- */

/** Queue one refresh per request; it is sent when the request ends. */
function cooldog_headless_queue_refresh() {
	$GLOBALS['cooldog_headless_refresh'] = true;
}

add_action(
	'shutdown',
	function () {
		if ( empty( $GLOBALS['cooldog_headless_refresh'] ) ) {
			return;
		}
		cooldog_headless_send_refresh();
	}
);

/** Ask the front end to refresh its WordPress data. Returns the HTTP result. */
function cooldog_headless_send_refresh( $blocking = false ) {
	$settings = cooldog_headless_settings();
	$frontend = cooldog_headless_frontend();
	if ( ! $frontend || ! $settings['secret'] ) {
		return new WP_Error( 'cooldog_headless_not_configured', 'Front-end URL or secret is not set.' );
	}
	return wp_remote_post(
		$frontend . '/api/revalidate/',
		array(
			'headers'  => array( 'x-revalidate-secret' => $settings['secret'] ),
			'timeout'  => $blocking ? 15 : 5,
			'blocking' => $blocking,
		)
	);
}

add_action(
	'save_post',
	function ( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}
		if ( in_array( $post->post_type, array( 'page', 'post', 'product', 'product_variation', 'attachment' ), true ) ) {
			cooldog_headless_queue_refresh();
		}
	},
	10,
	2
);
add_action( 'deleted_post', 'cooldog_headless_queue_refresh' );
add_action( 'trashed_post', 'cooldog_headless_queue_refresh' );
add_action( 'created_term', 'cooldog_headless_queue_refresh' );
add_action( 'edited_term', 'cooldog_headless_queue_refresh' );
add_action( 'delete_term', 'cooldog_headless_queue_refresh' );
// WooCommerce: prices, stock and variations changed outside the editor.
add_action( 'woocommerce_update_product', 'cooldog_headless_queue_refresh' );
add_action( 'woocommerce_update_product_variation', 'cooldog_headless_queue_refresh' );
add_action( 'woocommerce_product_set_stock', 'cooldog_headless_queue_refresh' );
add_action( 'woocommerce_variation_set_stock', 'cooldog_headless_queue_refresh' );
// Yoast SEO changes to categories are stored in an option.
add_action( 'update_option_wpseo_taxonomy_meta', 'cooldog_headless_queue_refresh' );

/* ------------------------------------------------------------------------- */
/* 4. Settings screen                                                         */
/* ------------------------------------------------------------------------- */

add_action(
	'admin_init',
	function () {
		register_setting(
			'cooldog_headless',
			COOLDOG_HEADLESS_OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => function ( $input ) {
					return array(
						'frontend_url' => isset( $input['frontend_url'] ) ? esc_url_raw( trim( $input['frontend_url'] ) ) : '',
						'secret'       => isset( $input['secret'] ) ? sanitize_text_field( $input['secret'] ) : '',
						'redirect'     => ! empty( $input['redirect'] ) ? '1' : '0',
					);
				},
			)
		);
	}
);

add_action(
	'admin_menu',
	function () {
		add_options_page( 'Cool Dog Headless', 'Cool Dog Headless', 'manage_options', 'cooldog-headless', 'cooldog_headless_settings_page' );
	}
);

function cooldog_headless_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$settings = cooldog_headless_settings();
	$result   = null;
	if ( isset( $_POST['cooldog_headless_test'] ) ) {
		check_admin_referer( 'cooldog_headless_test' );
		$response = cooldog_headless_send_refresh( true );
		$result   = is_wp_error( $response )
			? 'Failed: ' . $response->get_error_message()
			: 'Front end answered ' . wp_remote_retrieve_response_code( $response ) . ': ' . wp_remote_retrieve_body( $response );
	}
	?>
	<div class="wrap">
		<h1>Cool Dog Headless</h1>
		<p>This WordPress site is the content manager and store back end for the Next.js website. Shoppers browse the new site; cart, checkout and accounts stay here.</p>
		<?php if ( $result ) : ?>
			<div class="notice <?php echo 0 === strpos( $result, 'Front end answered 200' ) ? 'notice-success' : 'notice-error'; ?>"><p><?php echo esc_html( $result ); ?></p></div>
		<?php endif; ?>
		<form method="post" action="options.php">
			<?php settings_fields( 'cooldog_headless' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="cdh-url">Website address</label></th>
					<td><input id="cdh-url" class="regular-text" type="url" name="<?php echo esc_attr( COOLDOG_HEADLESS_OPTION ); ?>[frontend_url]" value="<?php echo esc_attr( $settings['frontend_url'] ); ?>" placeholder="https://www.cooldogwaterfountains.com">
					<p class="description">The Next.js site (no trailing slash).</p></td>
				</tr>
				<tr>
					<th scope="row"><label for="cdh-secret">Refresh secret</label></th>
					<td><input id="cdh-secret" class="regular-text" type="password" autocomplete="off" name="<?php echo esc_attr( COOLDOG_HEADLESS_OPTION ); ?>[secret]" value="<?php echo esc_attr( $settings['secret'] ); ?>">
					<p class="description">Same value as <code>REVALIDATE_SECRET</code> in Vercel. Changes here refresh the website within seconds.</p></td>
				</tr>
				<tr>
					<th scope="row">Send visitors to the website</th>
					<td><label><input type="checkbox" name="<?php echo esc_attr( COOLDOG_HEADLESS_OPTION ); ?>[redirect]" value="1" <?php checked( '1', $settings['redirect'] ); ?>> Redirect WordPress pages to the same page on the website</label>
					<p class="description">Cart, checkout, My Account, admin and logged-in editors are never redirected. Turn on after the website is live.</p></td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<form method="post">
			<?php wp_nonce_field( 'cooldog_headless_test' ); ?>
			<button class="button" name="cooldog_headless_test" value="1">Test refresh now</button>
		</form>
	</div>
	<?php
}
