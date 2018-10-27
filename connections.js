global[__filename]={};
module.exports={ 
    set:function(key,url){
        global[__filename][key]=url;
        },
     get:function(key){
         return global[__filename][key];
     }   
};
