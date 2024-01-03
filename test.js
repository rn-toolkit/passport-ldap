
var ldap = require('ldapjs');

const client = ldap.createClient({
    url: 'ldap://192.168.100.3:389',
  });
  client.on('connectError', function(errr) {
  console.log('userdap2 connectError', errr);
});
client.on('connect', function() {
  console.log('connected');
});

client.bind('appstore', 'Utapps@2024', function(err, user) {
  console.log('userdap2', err, user);
});
