package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, userSig *string) (bool, error) {
	var result bool
	err := mrQueryable.QueryRow("SELECT EXISTS(SELECT * FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `join_1`.`sig` = ?)", userSig).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
