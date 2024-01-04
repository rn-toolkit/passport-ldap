var Ldap = require('ldapjs');

/**
 * @typedef LdapAuth
 * @type {object}
 * @property {Ldap.Client} client - Username to use
//  * @property {string} pass - Password to use
 */

/**
* @constructor
* @param {(Object|optionsCallback)} options - Configuration options or options returning function
* @param {Object} options.server - [ldapauth-fork options]{@link https://github.com/vesse/node-ldapauth-fork}
*/
var LdapAuth = function(options) {
  this.options = options;
  var userLdap = new Ldap.createClient({
    url: options.url
  });

  userLdap.on('connectError', function(err) {
    console.log('ldap connectError', err.message);
  });

  var adminLdap = new Ldap.createClient({
    url: options.url
  });

  adminLdap.on('connectError', function(err) {
    console.log('ldap connectError', err);
  });

  this.client = userLdap;
  this.admin = adminLdap;
};

LdapAuth.prototype.authenticate = function(username, password, cb) {
  var self = this;
  var options = self.options;
  self.client.bind(username, password, function(err, res) {
    if (err){
      cb(err);
      return;
    }
    self.client.unbind();

    self.admin.bind(options.bindDN, options.bindCredentials, function(err2) {
      if (err2){
        // console.log('err2', err2);
        cb(err);
        return;
      }
      if (res){

        var opts = {
          filter: options.searchFilter.replace('{{username}}', username), // 查询条件过滤器，查找uid= xxx 的用户节点
          scope: 'sub', // 查询范围
          timeLimit: 1000, // 查询超时
          attributes: options.attrs ? ['sn', 'cn'].concat(options.attrs) : ['sn', 'cn']
        };

        // console.log(opts, options.searchBase);
        // 处理查询到文档的事件
        self.admin.search(options.searchBase, opts, function(err3, res2) {
        // 标志位
          var SearchSuccess = false;

          //   console.log('err3', err3);

          //   res2.on('searchRequest', function(searchRequest)  {
          //     console.log('searchRequest: ', searchRequest.messageId);
          //     cb(undefined, searchRequest);
          //     return;
          //   });
          // 得到文档
          res2.on('searchEntry', function(entry) {
            SearchSuccess = true;
            // 解析文档
            var user = entry.pojo;
            if (user.attributes){
              cb(undefined, user.attributes);
              return;
            } else {
              cb(undefined, user);
              return;
            }
          });

          // 查询错误事件
          res2.on('error', function(err4) {
            // console.log('error4', err4.message);
            SearchSuccess = false;
            self.admin.unbind();
            cb(err4);
            return;
          });

          // 查询结束
          res2.on('end', function() {
            self.admin.unbind();
            if (false == SearchSuccess) {
            // 返回查询失败的通知
              cb(new Error('查询结束，查询失败！'));
              return;
            }
            // console.log('end');
          });
        });
      }
    });
  });


};

module.exports =  LdapAuth;


