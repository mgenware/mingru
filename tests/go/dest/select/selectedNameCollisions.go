import "github.com/mgenware/go-packagex/v5/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	Title        string
	Title2       string
	A            string
	Title3       string
	A            string
	A            uint64
	UserUrlName  string
	UserUrlName2 string
	A            string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `post`.`title` AS `title`, `post`.`title` AS `title2`, `post`.`title` AS `a`, `post`.`title` AS `title3`, `post`.`title` AS `a`, `post`.`user_id` AS `a`, `join_1`.`url_name` AS `userUrlName`, `join_1`.`url_name` AS `userUrlName2`, `join_1`.`url_name` AS `a` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.Title, &result.Title2, &result.A, &result.Title3, &result.A, &result.A, &result.UserUrlName, &result.UserUrlName2, &result.A)
	if err != nil {
		return nil, err
	}
	return result, nil
}
