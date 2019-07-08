handlers.GetRank = getRank;
function getRank(args) {
    var maxNum = 100;
    var constrains = {};
    constrains.ShowAvatarUrl = true;
    constrains.ShowDisplayName = true;
    constrains.ShowLocations = true;
    constrains.ShowStatistics = true;
    constrains.ShowTags = true;
    var result = {};
    var copy = {};
    result.CoinRanks = getRankDatas(KEY_Statistics_Coin, maxNum, constrains, copy);
    result.CollectionRanks = getRankDatas(KEY_Statistics_Collection, maxNum, constrains, copy);
    result.InstanceRanks = getRankDatas(KEY_Statistics_Instance, maxNum, constrains, copy);
    result.LevelRanks = getRankDatas(KEY_Statistics_Level, maxNum, constrains, copy);
    result.CoinRanks = changeRankDatas(KEY_Statistics_Coin, result.CoinRanks, copy);
    result.CollectionRanks = changeRankDatas(KEY_Statistics_Collection, result.CollectionRanks, copy);
    result.InstanceRanks = changeRankDatas(KEY_Statistics_Instance, result.InstanceRanks, copy);
    result.LevelRanks = changeRankDatas(KEY_Statistics_Level, result.LevelRanks, copy);
    result.id = Func_Code.SC_GET_RANKS;
    return result;
}
function getRankDatas(key, max, constranins, copy) {
    var getLeaderborad = server.GetLeaderboard({
        MaxResultsCount: max,
        ProfileConstraints: constranins,
        StartPosition: 0,
        StatisticName: key
    }).Leaderboard;
    if (getLeaderborad.length > 0) {
        var rankDatas = [];
        for (var _i = 0, getLeaderborad_1 = getLeaderborad; _i < getLeaderborad_1.length; _i++) {
            var lb = getLeaderborad_1[_i];
            var rank = {};
            rank.Guid = lb.PlayFabId;
            rank.Rank = lb.Position;
            rank.ImageUrl = lb.Profile.AvatarUrl;
            rank.Name = lb.DisplayName;
            rank.IsSelf = currentPlayerId == lb.PlayFabId;
            if (key == KEY_Statistics_Coin) {
                rank.Coin = lb.StatValue;
            }
            else if (key == KEY_Statistics_Collection) {
                rank.Collection = lb.StatValue;
            }
            else if (key == KEY_Statistics_Instance) {
                rank.Instance = lb.StatValue;
            }
            else if (key == KEY_Statistics_Level) {
                rank.Level = lb.StatValue;
            }
            rankDatas.push(rank);
            var storage = void 0;
            if (copy.hasOwnProperty(rank.Guid)) {
                storage = copy[rank.Guid];
            }
            else {
                storage = {};
            }
            if (key == KEY_Statistics_Coin) {
                storage.Coin = lb.StatValue;
            }
            else if (key == KEY_Statistics_Collection) {
                storage.Collection = lb.StatValue;
            }
            else if (key == KEY_Statistics_Instance) {
                storage.Instance = lb.StatValue;
            }
            else if (key == KEY_Statistics_Level) {
                storage.Level = lb.StatValue;
            }
            copy[rank.Guid] = storage;
        }
        return rankDatas;
    }
    return null;
}
function changeRankDatas(key, datas, copy) {
    if (datas != null) {
        if (key == KEY_Statistics_Coin) {
            for (var key_1 in copy) {
                if (copy.hasOwnProperty(key_1)) {
                    var element = copy[key_1];
                    log.debug("Copy:" + JSON.stringify(element));
                }
            }
        }
        if (key == KEY_Statistics_Coin) {
            for (var _i = 0, datas_1 = datas; _i < datas_1.length; _i++) {
                var c = datas_1[_i];
                log.debug("Before:" + JSON.stringify(c));
            }
        }
        for (var _a = 0, datas_2 = datas; _a < datas_2.length; _a++) {
            var r = datas_2[_a];
            if (copy.hasOwnProperty(r.Guid)) {
                var index = datas.indexOf(r);
                var storage = copy[r.Guid];
                if (r.Coin <= 0) {
                    r.Coin = storage.Coin;
                }
                if (r.Level <= 0) {
                    r.Level = storage.Level;
                }
                if (r.Collection <= 0) {
                    r.Collection = storage.Collection;
                }
                if (r.Instance <= 0) {
                    r.Instance = storage.Instance;
                }
                datas[index] = r;
            }
        }
        if (key == KEY_Statistics_Coin) {
            for (var _b = 0, datas_3 = datas; _b < datas_3.length; _b++) {
                var c = datas_3[_b];
                log.debug("After:" + JSON.stringify(c));
            }
        }
    }
    return datas;
}
