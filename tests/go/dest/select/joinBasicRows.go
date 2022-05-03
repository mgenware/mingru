package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTResult struct {
	Title       string
	UserUrlName string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) ([]PostAGSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `join_1`.`url_name`, `db_post`.`title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` WHERE `join_1`.`sig`-`db_post`.`user_id` ORDER BY `join_1`.`sig`, `db_post`.`user_id` DESC")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
		err = rows.Scan(&item.UserUrlName, &item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
