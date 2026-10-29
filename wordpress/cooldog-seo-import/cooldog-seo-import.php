<?php
/**
 * Plugin Name: Cool Dog SEO Import
 * Description: One-time import of optimized Yoast SEO titles, meta descriptions and focus keyphrases for all pages, products and product categories. Go to Tools → Cool Dog SEO Import, review, then Apply. Deactivate and delete when done.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Cool Dog Water Fountains
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const COOLDOG_SEO_BACKUP_OPTION = 'cooldog_seo_import_backup';

add_action(
	'admin_menu',
	function () {
		add_management_page(
			'Cool Dog SEO Import',
			'Cool Dog SEO Import',
			'manage_options',
			'cooldog-seo-import',
			'cooldog_seo_import_page'
		);
	}
);

/** The optimized SEO values bundled with this plugin. */
function cooldog_seo_items() {
	$json = file_get_contents( __DIR__ . '/seo-data.json' );
	$data = json_decode( $json, true );
	return is_array( $data ) && isset( $data['items'] ) ? $data['items'] : array();
}

/** Current Yoast values for one item. */
function cooldog_seo_current( $item ) {
	$id = (int) $item['id'];
	if ( 'term' === $item['type'] ) {
		if ( ! class_exists( 'WPSEO_Taxonomy_Meta' ) ) {
			return array( 'title' => '', 'description' => '', 'focuskw' => '', 'noindex' => '' );
		}
		return array(
			'title'       => (string) WPSEO_Taxonomy_Meta::get_term_meta( $id, 'product_cat', 'title' ),
			'description' => (string) WPSEO_Taxonomy_Meta::get_term_meta( $id, 'product_cat', 'desc' ),
			'focuskw'     => (string) WPSEO_Taxonomy_Meta::get_term_meta( $id, 'product_cat', 'focuskw' ),
			'noindex'     => '',
		);
	}
	return array(
		'title'       => (string) get_post_meta( $id, '_yoast_wpseo_title', true ),
		'description' => (string) get_post_meta( $id, '_yoast_wpseo_metadesc', true ),
		'focuskw'     => (string) get_post_meta( $id, '_yoast_wpseo_focuskw', true ),
		'noindex'     => (string) get_post_meta( $id, '_yoast_wpseo_meta-robots-noindex', true ),
	);
}

/** Whether the item exists on this site. */
function cooldog_seo_exists( $item ) {
	$id = (int) $item['id'];
	if ( 'term' === $item['type'] ) {
		$term = get_term( $id, 'product_cat' );
		return $term && ! is_wp_error( $term );
	}
	return (bool) get_post( $id );
}

/** Admin URL for editing the item. */
function cooldog_seo_edit_link( $item ) {
	return 'term' === $item['type']
		? get_edit_term_link( (int) $item['id'], 'product_cat' )
		: get_edit_post_link( (int) $item['id'] );
}

/** Write values for one item, then ask Yoast to refresh its stored copy. */
function cooldog_seo_write( $item, $values ) {
	$id = (int) $item['id'];

	if ( 'term' === $item['type'] ) {
		if ( ! class_exists( 'WPSEO_Taxonomy_Meta' ) ) {
			return false;
		}
		WPSEO_Taxonomy_Meta::set_values(
			$id,
			'product_cat',
			array(
				'wpseo_title'   => sanitize_text_field( $values['title'] ),
				'wpseo_desc'    => sanitize_textarea_field( $values['description'] ),
				'wpseo_focuskw' => sanitize_text_field( $values['focuskw'] ),
			)
		);
		cooldog_seo_rebuild_indexable( $id, 'term' );
		return true;
	}

	$meta = array(
		'_yoast_wpseo_title'    => sanitize_text_field( $values['title'] ),
		'_yoast_wpseo_metadesc' => sanitize_textarea_field( $values['description'] ),
		'_yoast_wpseo_focuskw'  => sanitize_text_field( $values['focuskw'] ),
	);
	foreach ( $meta as $key => $value ) {
		if ( '' === $value ) {
			delete_post_meta( $id, $key );
		} else {
			update_post_meta( $id, $key, $value );
		}
	}
	// Only ever turns noindex on (for pages like the form confirmation);
	// restoring a backup puts back whatever was there before.
	if ( ! empty( $values['noindex'] ) ) {
		update_post_meta( $id, '_yoast_wpseo_meta-robots-noindex', '1' );
	} elseif ( array_key_exists( 'noindex', $values ) && '' === $values['noindex'] && ! empty( $values['restore'] ) ) {
		delete_post_meta( $id, '_yoast_wpseo_meta-robots-noindex' );
	}
	cooldog_seo_rebuild_indexable( $id, 'post' );
	return true;
}

/** Yoast serves SEO data from its "indexables" table; rebuild the entry. */
function cooldog_seo_rebuild_indexable( $id, $type ) {
	clean_post_cache( $id );
	if ( ! function_exists( 'YoastSEO' ) ) {
		return;
	}
	try {
		$repository = YoastSEO()->classes->get( \Yoast\WP\SEO\Repositories\Indexable_Repository::class );
		$builder    = YoastSEO()->classes->get( \Yoast\WP\SEO\Builders\Indexable_Builder::class );
		$indexable  = $repository->find_by_id_and_type( $id, $type, false );
		$builder->build_for_id_and_type( $id, $type, $indexable );
	} catch ( \Throwable $e ) {
		// Yoast will rebuild it the next time the item is saved.
	}
}

function cooldog_seo_apply() {
	$items  = cooldog_seo_items();
	$backup = array();
	$done   = 0;
	foreach ( $items as $item ) {
		if ( ! cooldog_seo_exists( $item ) ) {
			continue;
		}
		$backup[ $item['type'] . ':' . $item['id'] ] = cooldog_seo_current( $item );
		if ( cooldog_seo_write( $item, $item ) ) {
			$done++;
		}
	}
	// Keep the first backup (the original values) if Apply is run twice.
	if ( ! get_option( COOLDOG_SEO_BACKUP_OPTION ) ) {
		update_option( COOLDOG_SEO_BACKUP_OPTION, $backup, false );
	}
	return $done;
}

function cooldog_seo_restore() {
	$backup = get_option( COOLDOG_SEO_BACKUP_OPTION );
	if ( ! is_array( $backup ) ) {
		return 0;
	}
	$done = 0;
	foreach ( cooldog_seo_items() as $item ) {
		$key = $item['type'] . ':' . $item['id'];
		if ( isset( $backup[ $key ] ) && cooldog_seo_exists( $item ) ) {
			cooldog_seo_write( $item, array_merge( $backup[ $key ], array( 'restore' => true ) ) );
			$done++;
		}
	}
	delete_option( COOLDOG_SEO_BACKUP_OPTION );
	return $done;
}

function cooldog_seo_import_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to do this.' ) );
	}

	$notice = '';
	if ( isset( $_POST['cooldog_seo_action'] ) ) {
		check_admin_referer( 'cooldog_seo_import' );
		if ( 'apply' === $_POST['cooldog_seo_action'] ) {
			$notice = sprintf( 'Applied optimized SEO to %d items. Clear any page cache, then refresh the new site.', cooldog_seo_apply() );
		} elseif ( 'restore' === $_POST['cooldog_seo_action'] ) {
			$notice = sprintf( 'Restored the previous SEO values for %d items.', cooldog_seo_restore() );
		}
	}

	$yoast_active = defined( 'WPSEO_VERSION' );
	$has_backup   = (bool) get_option( COOLDOG_SEO_BACKUP_OPTION );
	$items        = cooldog_seo_items();
	?>
	<div class="wrap">
		<h1>Cool Dog SEO Import</h1>
		<p>Optimized Yoast SEO titles, meta descriptions and focus keyphrases for <?php echo count( $items ); ?> pages, products and product categories. Review the new values below, then click <strong>Apply</strong>. The current values are saved first, so you can restore them.</p>

		<?php if ( ! $yoast_active ) : ?>
			<div class="notice notice-error"><p>Yoast SEO is not active. Activate it before applying.</p></div>
		<?php endif; ?>
		<?php if ( $notice ) : ?>
			<div class="notice notice-success"><p><?php echo esc_html( $notice ); ?></p></div>
		<?php endif; ?>

		<form method="post" style="margin:16px 0">
			<?php wp_nonce_field( 'cooldog_seo_import' ); ?>
			<button class="button button-primary" name="cooldog_seo_action" value="apply" <?php disabled( ! $yoast_active ); ?>>Apply optimized SEO</button>
			<?php if ( $has_backup ) : ?>
				<button class="button" name="cooldog_seo_action" value="restore" onclick="return confirm('Restore the SEO values from before the import?')">Restore previous values</button>
			<?php endif; ?>
		</form>

		<table class="widefat striped">
			<thead>
				<tr>
					<th style="width:18%">Item</th>
					<th>Current title / description</th>
					<th>New title / description</th>
					<th style="width:14%">Focus keyphrase</th>
				</tr>
			</thead>
			<tbody>
			<?php foreach ( $items as $item ) : ?>
				<?php
				$exists  = cooldog_seo_exists( $item );
				$current = $exists ? cooldog_seo_current( $item ) : null;
				?>
				<tr>
					<td>
						<?php if ( $exists ) : ?>
							<a href="<?php echo esc_url( cooldog_seo_edit_link( $item ) ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
						<?php else : ?>
							<?php echo esc_html( $item['label'] ); ?> <em>(not found, skipped)</em>
						<?php endif; ?>
						<br><small><?php echo esc_html( 'term' === $item['type'] ? 'Product category' : get_post_type( (int) $item['id'] ) ); ?> #<?php echo (int) $item['id']; ?></small>
						<?php if ( ! empty( $item['noindex'] ) ) : ?><br><small>Hidden from search (noindex)</small><?php endif; ?>
					</td>
					<td>
						<?php if ( $current ) : ?>
							<strong><?php echo esc_html( $current['title'] ? $current['title'] : '(default)' ); ?></strong><br>
							<?php echo esc_html( $current['description'] ? $current['description'] : '(none)' ); ?>
						<?php endif; ?>
					</td>
					<td>
						<strong><?php echo esc_html( $item['title'] ); ?></strong> <small>(<?php echo ( function_exists( 'mb_strlen' ) ? mb_strlen( $item['title'] ) : strlen( $item['title'] ) ); ?>)</small><br>
						<?php echo esc_html( $item['description'] ); ?> <small>(<?php echo ( function_exists( 'mb_strlen' ) ? mb_strlen( $item['description'] ) : strlen( $item['description'] ) ); ?>)</small>
					</td>
					<td><?php echo esc_html( $item['focuskw'] ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<?php
}
