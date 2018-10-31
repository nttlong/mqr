function clear_tress (value) {

    var map = {
        "%C3%A9": "e", "%C3%A8": "e", "%E1%BA%BB": "e", "%E1%BA%BD": "e", "%E1%BA%B9": "e", "%C3%AA": "e", "%E1%BA%BF": "e", "%E1%BB%81": "e", "%E1%BB%83": "e", "%E1%BB%85": "e", "%E1%BB%87": "e",
        "%C3%A1": "a", "%C3%A0": "a", "%E1%BA%A3": "a", "%C3%A3": "a", "%E1%BA%A1": "a", "%C3%A2": "a", "%E1%BA%A5": "a", "%E1%BA%A7": "a", "%E1%BA%A9": "a", "%E1%BA%AB": "a", "%E1%BA%AD": "a", "%C4%83": "a", "%E1%BA%AF": "a", "%E1%BA%B1": "a", "%E1%BA%B3": "a", "%E1%BA%B5": "a", "%E1%BA%B7": "a",
        "%C3%AD": "i", "%C3%AC": "i", "%E1%BB%89": "i", "%C4%A9": "i", "%E1%BB%8B": "i",
        "%C3%B3": "o", "%C3%B2": "o", "%E1%BB%8F": "o", "%C3%B5": "o", "%E1%BB%8D": "o", "%C3%B4": "o", "%E1%BB%91": "o", "%E1%BB%93": "o", "%E1%BB%95": "o", "%E1%BB%97": "o", "%E1%BB%99": "o", "%C6%A1": "o", "%E1%BB%9B": "o", "%E1%BB%9D": "o", "%E1%BB%9F": "o", "%E1%BB%A1": "o", "%E1%BB%A3": "o",
        "%C3%BA": "u", "%C3%B9": "u", "%E1%BB%A7": "u", "%C5%A9": "u", "%E1%BB%A5": "u", "%C6%B0": "u", "%E1%BB%A9": "u", "%E1%BB%AB": "u", "%E1%BB%AD": "u", "%E1%BB%AF": "u", "%E1%BB%B1": "u",
        "%C3%BD": "y", "%E1%BB%B3": "y", "%E1%BB%B7": "y", "%E1%BB%B9": "y", "%E1%BB%B5": "y",
        "%C4%91": "d",
        "a%CC%81": "a", "a%CC%80": "a", "a%CC%89": "a", "a%CC%83": "a", "a%CC%A3": "a", "%C3%A2": "a", "%C3%A2%CC%81": "a", "%C3%A2%CC%80": "a", "%C3%A2%CC%89": "a", "%C3%A2%CC%83": "a", "%C3%A2%CC%A3": "a", "%C4%83": "a", "%C4%83%CC%81": "a", "%C4%83%CC%80": "a", "%C4%83%CC%89": "a", "%C4%83%CC%83": "a", "%C4%83%CC%A3": "a",
        "e%CC%81": "e", "e%CC%80": "e", "e%CC%89": "e", "e%CC%83": "e", "e%CC%A3": "e", "%C3%AA": "e", "%C3%AA%CC%81": "e", "%C3%AA%CC%80": "e", "%C3%AA%CC%89": "e", "%C3%AA%CC%83": "e", "%C3%AA%CC%A3": "e",
        "i%CC%81": "i", "i%CC%80": "i", "i%CC%89": "i", "i%CC%83": "i",
        "o%CC%81": "o", "o%CC%80": "o", "o%CC%89": "o", "o%CC%83": "o", "o%CC%A3": "o", "%C3%B4": "o", "%C3%B4%CC%81": "o", "%C3%B4%CC%80": "o", "%C3%B4%CC%89": "o", "%C3%B4%CC%83": "o", "%C3%B4%CC%A3": "o", "%C6%A1": "o", "%C6%A1%CC%81": "o", "%C6%A1%CC%80": "o", "%C6%A1%CC%89": "o", "%C6%A1%CC%83": "o", "%C6%A1%CC%A3": "o",
        "u%CC%81": "u", "u%CC%80": "u", "u%CC%89": "u", "u%CC%83": "u", "u%CC%A3": "u", "%C6%B0": "u", "%C6%B0%CC%81": "u", "%C6%B0%CC%80": "u", "%C6%B0%CC%89": "u", "%C6%B0%CC%83": "u", "%C6%B0%CC%A3": "u",
        "y%CC%81": "y", "y%CC%80": "y", "y%CC%89": "y", "y%CC%A3": "y",
        "%C4%91": "d"
    };

    if (value == null) return "";
    value = value.toLowerCase();
    var ret = "";
    for (var i = 0; i < value.length; i++) {
        var k = encodeURIComponent(value[i]);
        var v = value[i];
        if (map[k]) {
            v = map[k];
        }
        if ("qwertyuiopasdfghjklzxcvbnm0123456789".indexOf(v) !== -1) {
            ret += v;
        }
        else {
            if (v === " ") {
                ret += v;
            }
        }

    }
    while (ret.indexOf("  ") > -1) ret = ret.replace("  ", " ");
    while (ret[0] === " ") ret = ret.substring(1, ret.length);
    while (ret[ret.length - 1] === " ") ret = ret.substring(0, ret.length - 1);
    return ret;
};
module.exports=clear_tress;