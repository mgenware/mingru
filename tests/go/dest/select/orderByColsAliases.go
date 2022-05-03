package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTResult struct {
	MUserAge int
	Title    string
	UserAge  int
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) ([]PostAGSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `db_post`.`title`, `join_1`.`age`, `join_2`.`age` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `db_post`.`my_user_id` ORDER BY `db_post`.`title`, `join_1`.`age`, `join_2`.`age`")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
		err = rows.Scan(&item.Title, &item.UserAge, &item.MUserAge)
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
