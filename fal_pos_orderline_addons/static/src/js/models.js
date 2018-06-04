odoo.define('fal_pos_promotional_scheme.models', function (require) {
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    var core = require('web.core');
    var QWeb     = core.qweb;
    var utils = require('web.utils');

    var round_pr = utils.round_precision;
    var round_di = utils.round_decimals;
    var _t = core._t;

    models.load_fields("product.product", "is_topping_item");
    models.load_fields("product.product", "available_topping_ids");

    var _super_order_line = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function (attributes, options) {
            var self = this;
            _super_order_line.initialize.apply(this, arguments)
            this.addons_products = this.addons_products || [];
        },
        // Change how we calculate the unit price (Normal Unit Price + total Addons)
        get_unit_price: function(){
            var digits = this.pos.dp['Product Price'];
            // round and truncate to mimic _symbol_set behavior
            return parseFloat(round_di(this.price + this.get_addons_total_price()|| 0, digits).toFixed(digits));
        },
        // Addons product management
        add_addons_product: function(addons_product){
            if (!(this.addons_products.includes(addons_product))){
                this.addons_products.push(addons_product);
                this.trigger('change',this);
            }
        },
        get_addons_product: function(){
            return this.addons_products;
        },
        has_addons: function(){
            if (this.addons_products.length > 0){
                return true
            }else{
                return false
            }
            return false
        },
        destroy_addons_product: function(){
            this.addons_products = [];
            this.trigger('change',this);
        },
        get_addons_product_array: function(){
            var res = []
            for (var i = 0; i < this.get_addons_product().length; i++){
                res.push(this.pos.db.product_by_id[this.get_addons_product()[i]])
            }
            return res;
        },
        get_addons_total_price: function(){
            var res = 0
            for (var i = 0; i < this.get_addons_product().length; i++){
                res += this.pos.db.product_by_id[this.get_addons_product()[i]].lst_price
            }
            return res;
        },
        // JSON
        export_as_JSON: function(){
            var json = _super_order_line.export_as_JSON.call(this);
            json.addons_products = this.addons_products;
            return json;
        },
        init_from_JSON: function(json){
            _super_order_line.init_from_JSON.apply(this,arguments);
            this.addons_products = json.addons_products;
        },
    });

});
