package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	MUserAge int
	Title    string
	UserAge  int
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) ([]PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `db_post`.`title`, `join_1`.`age`, `join_2`.`age` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `db_post`.`my_user_id` ORDER BY `db_post`.`title`, `join_1`.`age`, `join_2`.`age`")
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
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
